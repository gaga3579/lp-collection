import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Record, RecordInput } from "@/lib/types";
import RecordForm from "./RecordForm";

function getInputByLabel(label: string): HTMLInputElement {
  // Labels in this form aren't htmlFor-associated, so find the field group by
  // its label text and grab the control inside it. Number inputs expose the
  // "spinbutton" role rather than "textbox", so query both.
  const labelEl = screen.getByText(label);
  const group = labelEl.parentElement as HTMLElement;
  const input = within(group).queryByRole("textbox") ?? within(group).getByRole("spinbutton");
  return input as HTMLInputElement;
}

describe("RecordForm", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("starts blank when no initial record is given", () => {
    render(<RecordForm onSubmit={vi.fn()} />);
    expect(getInputByLabel("Artist")).toHaveValue("");
    expect(getInputByLabel("Title")).toHaveValue("");
    expect(screen.getByRole("button", { name: "Add record" })).toBeInTheDocument();
  });

  it("prefills from an initial record and labels the submit 'Save changes'", () => {
    const initial: Record = {
      id: "x1",
      artist: "Nina Simone",
      title: "Pastel Blues",
      year: 1965,
      genre: "jazz",
      rating: 5,
      notes: "great",
      cover_url: null,
      purchase_price: 18000,
      purchase_date: "2024-02-02",
      condition: "vg",
      created_at: "2026-01-01T00:00:00.000Z",
    };
    render(<RecordForm initial={initial} onSubmit={vi.fn()} />);
    expect(getInputByLabel("Artist")).toHaveValue("Nina Simone");
    expect(getInputByLabel("Title")).toHaveValue("Pastel Blues");
    expect(screen.getByRole("button", { name: "Save changes" })).toBeInTheDocument();
  });

  it("submits typed values to onSubmit", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn<(v: RecordInput) => void>();
    render(<RecordForm onSubmit={onSubmit} />);

    await user.type(getInputByLabel("Artist"), "Bill Evans");
    await user.type(getInputByLabel("Title"), "Waltz for Debby");
    await user.type(getInputByLabel("Year"), "1961");
    await user.click(screen.getByRole("button", { name: "Add record" }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    const values = onSubmit.mock.calls[0][0];
    expect(values.artist).toBe("Bill Evans");
    expect(values.title).toBe("Waltz for Debby");
    expect(values.year).toBe(1961);
    expect(values.genre).toBe("other"); // default
  });

  it("converts the rating select to a number (and empty to null)", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn<(v: RecordInput) => void>();
    render(<RecordForm onSubmit={onSubmit} />);

    await user.type(getInputByLabel("Artist"), "A");
    await user.type(getInputByLabel("Title"), "B");
    const ratingSelect = screen.getByText("Rating").parentElement as HTMLElement;
    await user.selectOptions(within(ratingSelect).getByRole("combobox"), "4");
    await user.click(screen.getByRole("button", { name: "Add record" }));

    expect(onSubmit.mock.calls[0][0].rating).toBe(4);
  });

  it("invokes onCancel when the Cancel button is clicked", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(<RecordForm onSubmit={vi.fn()} onCancel={onCancel} />);
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("hides the Cancel button when no onCancel is provided", () => {
    render(<RecordForm onSubmit={vi.fn()} />);
    expect(screen.queryByRole("button", { name: "Cancel" })).not.toBeInTheDocument();
  });

  it("disables the submit button and shows 'Saving…' while saving", () => {
    render(<RecordForm onSubmit={vi.fn()} saving />);
    const btn = screen.getByRole("button", { name: "Saving…" });
    expect(btn).toBeDisabled();
  });

  describe("Spotify lookup", () => {
    beforeEach(() => {
      vi.stubGlobal("fetch", vi.fn());
    });
    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it("fetches results and fills the form when a result is chosen", async () => {
      const user = userEvent.setup();
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => ({
          results: [
            {
              artist: "Radiohead",
              title: "OK Computer",
              year: 1997,
              cover_url: "https://img/ok.jpg",
            },
          ],
        }),
      });

      render(<RecordForm onSubmit={vi.fn()} />);
      await user.type(
        screen.getByPlaceholderText(/Miles Davis Kind of Blue/),
        "OK Computer"
      );
      await user.click(screen.getByRole("button", { name: "Search" }));

      // Result row appears.
      const result = await screen.findByText("OK Computer");
      await user.click(result);

      // Selecting a result populates the core fields.
      expect(getInputByLabel("Artist")).toHaveValue("Radiohead");
      expect(getInputByLabel("Title")).toHaveValue("OK Computer");
      expect(getInputByLabel("Year")).toHaveValue(1997);

      // Query string sent to the API is URL-encoded.
      expect(fetch).toHaveBeenCalledWith(
        "/api/spotify-search?q=OK%20Computer"
      );
    });

    it("shows the server error message when the search response is not ok", async () => {
      const user = userEvent.setup();
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: false,
        json: async () => ({ error: "Rate limited" }),
      });

      render(<RecordForm onSubmit={vi.fn()} />);
      await user.type(
        screen.getByPlaceholderText(/Miles Davis Kind of Blue/),
        "anything"
      );
      await user.click(screen.getByRole("button", { name: "Search" }));

      expect(await screen.findByText("Rate limited")).toBeInTheDocument();
    });

    it("shows a network error message when fetch rejects", async () => {
      const user = userEvent.setup();
      (fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("offline"));

      render(<RecordForm onSubmit={vi.fn()} />);
      await user.type(
        screen.getByPlaceholderText(/Miles Davis Kind of Blue/),
        "anything"
      );
      await user.click(screen.getByRole("button", { name: "Search" }));

      expect(
        await screen.findByText("Could not reach the search service.")
      ).toBeInTheDocument();
    });

    it("does not call fetch when the query is blank", async () => {
      const user = userEvent.setup();
      render(<RecordForm onSubmit={vi.fn()} />);
      await user.click(screen.getByRole("button", { name: "Search" }));
      expect(fetch).not.toHaveBeenCalled();
    });
  });
});
