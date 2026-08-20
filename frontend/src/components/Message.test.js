import { act, fireEvent, render, screen } from "@testing-library/react";
import Message from "./Message";

function formatDateTime(value) {
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

describe("Message", () => {
  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  test("renders a role-aware student entry confirmation and hides exit-only fields", () => {
    jest.useFakeTimers();

    render(
      <Message
        confirmation={{
          status: "ENTRY",
          details: {
            type: "student",
            visitor_name: "Rahul Sharma",
            roll_no: "FY101",
            department: "MCA",
            use_computer: "YES"
          }
        }}
        user={{}}
        setScreen={jest.fn()}
        mode="light"
        onToggleMode={jest.fn()}
      />
    );

    expect(screen.getByText("Student entry recorded")).toBeInTheDocument();
    expect(screen.getAllByText("Rahul Sharma").length).toBeGreaterThan(0);
    expect(screen.getByText("FY101")).toBeInTheDocument();
    expect(screen.getByText("MCA")).toBeInTheDocument();
    expect(screen.getByText("Using computer")).toBeInTheDocument();
    expect(screen.getByText(/returning home in 3s/i)).toBeInTheDocument();
    expect(screen.queryByText(/total time spent/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/entry time/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/exit time/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/closed automatically/i)).not.toBeInTheDocument();
  });

  test("renders staff exit details and shows the auto-exit notice only when enabled", () => {
    jest.useFakeTimers();

    render(
      <Message
        confirmation={{
          status: "EXIT",
          details: {
            type: "staff",
            visitor_name: "Prof. Iyer",
            entry_time: "2026-04-05T09:15:00",
            exit_time: "2026-04-05T11:20:00",
            duration: "2h 05m",
            is_auto_exit: true
          }
        }}
        user={{ staffId: "STF-09" }}
        setScreen={jest.fn()}
        mode="light"
        onToggleMode={jest.fn()}
      />
    );

    expect(screen.getByText("Staff exit recorded")).toBeInTheDocument();
    expect(screen.getByText("STF-09")).toBeInTheDocument();
    expect(screen.getByText("2h 05m")).toBeInTheDocument();
    expect(screen.getByText(new RegExp(formatDateTime("2026-04-05T09:15:00")))).toBeInTheDocument();
    expect(screen.getByText(new RegExp(formatDateTime("2026-04-05T11:20:00")))).toBeInTheDocument();
    expect(
      screen.getByText(/this visit was closed automatically after the timeout window\./i)
    ).toBeInTheDocument();
  });

  test("renders guest confirmations with guest-specific identity details", () => {
    jest.useFakeTimers();

    render(
      <Message
        confirmation={{
          status: "ENTRY",
          details: {
            type: "guest",
            visitor_name: "Asha Patil"
          }
        }}
        user={{}}
        setScreen={jest.fn()}
        mode="light"
        onToggleMode={jest.fn()}
      />
    );

    expect(screen.getByText("Guest entry recorded")).toBeInTheDocument();
    expect(screen.getAllByText("Asha Patil").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Guest").length).toBeGreaterThan(0);
    expect(screen.queryByText(/roll number/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/staff id/i)).not.toBeInTheDocument();
  });

  test("updates the visible countdown and returns home automatically after three seconds", () => {
    jest.useFakeTimers();
    const setScreen = jest.fn();

    render(
      <Message
        confirmation={{
          status: "ENTRY",
          details: {
            type: "student",
            visitor_name: "Rahul Sharma"
          }
        }}
        user={{}}
        setScreen={setScreen}
        mode="light"
        onToggleMode={jest.fn()}
      />
    );

    expect(screen.getByText(/returning home in 3s/i)).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(screen.getByText(/returning home in 2s/i)).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(setScreen).toHaveBeenCalledWith("home");
  });

  test("returns home immediately when the back button is pressed", () => {
    jest.useFakeTimers();
    const setScreen = jest.fn();

    render(
      <Message
        confirmation={{
          status: "ENTRY",
          details: {
            type: "student",
            visitor_name: "Rahul Sharma"
          }
        }}
        user={{}}
        setScreen={setScreen}
        mode="light"
        onToggleMode={jest.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /back to home/i }));

    expect(setScreen).toHaveBeenCalledWith("home");
  });
});
