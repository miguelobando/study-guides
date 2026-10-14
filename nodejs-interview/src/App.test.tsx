import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import App from './App';

async function startInterview(user: ReturnType<typeof userEvent.setup>, options: { count: string; strict?: boolean }) {
  render(<App />);
  await user.type(screen.getByLabelText(/your name/i), 'Ada');
  await user.selectOptions(screen.getByLabelText(/number of questions/i), options.count);
  if (options.strict) await user.click(screen.getByLabelText(/only at the end/i));
  await user.click(screen.getByRole('button', { name: /start interview/i }));
}

describe('App', () => {
  it('shows how many questions match the filters and blocks starting with none', async () => {
    const user = userEvent.setup();
    render(<App />);
    expect(screen.getByText(/questions match · this interview will have 25/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Clear' }));
    expect(screen.getByText(/no questions match/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /start interview/i })).toBeDisabled();
  });

  it('runs a full interview in study mode: answer, review, skip, summary and export', async () => {
    const user = userEvent.setup();
    const createObjectURL = vi.fn(() => 'blob:transcript');
    const revokeObjectURL = vi.fn();
    Object.assign(URL, { createObjectURL, revokeObjectURL });
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    await startInterview(user, { count: '10' });

    expect(screen.getByText('Question 1 / 10')).toBeInTheDocument();
    expect(screen.getByRole('region', { name: /where this question & answer come from/i })).toBeInTheDocument();

    // Submit is disabled until something is typed.
    const submit = screen.getByRole('button', { name: /submit answer/i });
    expect(submit).toBeDisabled();
    await user.type(screen.getByLabelText(/your answer/i), 'My first answer');
    await user.click(screen.getByLabelText('high'));
    await user.click(submit);

    // Study mode shows the rubric before moving on.
    expect(screen.getByText(/what a strong answer covers/i)).toBeInTheDocument();
    expect(screen.getByText('My first answer')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /next question/i }));

    // Skip the remaining nine.
    for (let i = 2; i <= 10; i++) {
      expect(screen.getByText(`Question ${i} / 10`)).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: /^skip$/i }));
      await user.click(screen.getByRole('button', { name: i === 10 ? /finish interview/i : /next question/i }));
    }

    expect(screen.getByRole('heading', { name: /interview complete/i })).toBeInTheDocument();
    const results = screen.getByRole('region', { name: 'Results' });
    expect(within(results).getByText('Answered').previousSibling).toHaveTextContent('1');
    expect(within(results).getByText('Skipped').previousSibling).toHaveTextContent('9');

    await user.click(screen.getByRole('button', { name: /download \.txt/i }));
    expect(createObjectURL).toHaveBeenCalledTimes(1);
    const blob = (createObjectURL.mock.calls[0] as unknown as [Blob])[0];
    const text = await blob.text();
    expect(text).toContain('Candidate:   Ada');
    expect(text).toContain('My first answer');
    expect(text).toContain('self-rated confidence: high');
    expect(text).toContain('INSTRUCTIONS FOR THE REVIEWER');
    expect(clickSpy).toHaveBeenCalled();
    clickSpy.mockRestore();
  });

  it('strict mode hides the rubric and moves straight to the next question', async () => {
    const user = userEvent.setup();
    await startInterview(user, { count: '10', strict: true });

    await user.type(screen.getByLabelText(/your answer/i), 'answer');
    await user.keyboard('{Control>}{Enter}{/Control}');

    expect(screen.queryByText(/what a strong answer covers/i)).not.toBeInTheDocument();
    expect(screen.getByText('Question 2 / 10')).toBeInTheDocument();
  });

  it('can end early, keeping the current draft', async () => {
    const user = userEvent.setup();
    await startInterview(user, { count: '10' });

    await user.type(screen.getByLabelText(/your answer/i), 'half-finished thought');
    await user.click(screen.getByRole('button', { name: /end interview early/i }));
    await user.click(screen.getByRole('button', { name: /yes, end interview/i }));

    const results = screen.getByRole('region', { name: 'Results' });
    expect(within(results).getByText('Answered').previousSibling).toHaveTextContent('1');
    expect(within(results).getByText('Not reached').previousSibling).toHaveTextContent('9');
  });

  it('offers to resume an unfinished interview after a reload', async () => {
    const user = userEvent.setup();
    await startInterview(user, { count: '10' });
    await user.click(screen.getByRole('button', { name: /^skip$/i }));
    await user.click(screen.getByRole('button', { name: /next question/i }));
    expect(screen.getByText('Question 2 / 10')).toBeInTheDocument();

    // Simulate a reload: unmount and render a fresh app that reads localStorage.
    document.body.innerHTML = '';
    render(<App />);
    expect(screen.getByText(/interview in progress/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /resume/i }));
    expect(screen.getByText('Question 2 / 10')).toBeInTheDocument();
  });
});
