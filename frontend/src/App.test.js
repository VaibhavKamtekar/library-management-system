import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import axios from "axios";
import App from "./App";

jest.mock("axios", () => ({
  __esModule: true,
  default: {
    get: jest.fn()
  }
}));
jest.mock("recharts", () => {
  const actual = jest.requireActual("recharts");

  return {
    ...actual,
    ResponsiveContainer: ({ children }) => <div data-testid="responsive-chart">{children}</div>
  };
});

jest.mock("./components/StudentEntry", () => () => <div>Student Entry</div>);
jest.mock("./components/StaffEntry", () => () => <div>Staff Entry</div>);
jest.mock("./components/GuestEntry", () => () => <div>Guest Entry</div>);
jest.mock("./components/InOut", () => () => <div>In Out</div>);
jest.mock("./components/Message", () => () => <div>Message</div>);
jest.mock("./components/AdminLogin", () => () => <div>Admin Login</div>);
jest.mock("./components/AdminDashboard", () => () => <div>Admin Dashboard</div>);

test("renders entry mode by default and loads dashboard metrics on toggle", async () => {
  axios.get.mockImplementation((url) => {
    if (url === "http://localhost:5000/api/admin/footfall") {
      return Promise.resolve({
        data: {
          students_today: 12,
          sport_today: 3,
          computer_today: 5,
          staff_today: 4,
          guests_today: 2
        }
      });
    }

    if (url === "http://localhost:5000/api/admin/monthly-footfall") {
      return Promise.resolve({
        data: [
          { month: 1, total_students: 120, total_sport: 10, total_computer: 45 },
          { month: 2, total_students: 150, total_sport: 14, total_computer: 52 },
          { month: 3, total_students: 180, total_sport: 18, total_computer: 61 }
        ]
      });
    }

    return Promise.reject(new Error(`Unexpected URL: ${url}`));
  });

  render(<App />);

  expect(screen.getByText(/library access portal/i)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /entry mode/i })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /student entry/i })).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: /dashboard mode/i }));

  await waitFor(() =>
    expect(axios.get).toHaveBeenCalledWith("http://localhost:5000/api/admin/footfall")
  );
  expect(axios.get).toHaveBeenCalledWith("http://localhost:5000/api/admin/monthly-footfall");

  expect(await screen.findByText("Students Today")).toBeInTheDocument();
  expect(screen.getAllByText("12").length).toBeGreaterThan(0);
  expect(screen.getByText("Sport Today")).toBeInTheDocument();
  expect(screen.getByText("Computer Usage")).toBeInTheDocument();
  expect(screen.getByText("Staff Today")).toBeInTheDocument();
  expect(screen.getByText("Guests Today")).toBeInTheDocument();
  expect(screen.getByText("Today's Footfall")).toBeInTheDocument();
  expect(screen.getByText("Today's Footfall Comparison")).toBeInTheDocument();
  expect(screen.getByText("Monthly Trend")).toBeInTheDocument();
  expect(screen.getByText("Visitor Distribution")).toBeInTheDocument();
  expect(
    screen.getByText(/student, sport, computer, staff, and guest activity/i)
  ).toBeInTheDocument();
  expect(
    screen.getByText(/activity across students, sport, computer, staff, and guests/i)
  ).toBeInTheDocument();
});
