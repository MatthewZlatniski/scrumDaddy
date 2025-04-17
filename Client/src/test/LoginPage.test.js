import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter, Router } from "react-router-dom";
import "@testing-library/jest-dom";
import LoginPage from "../components/LoginPage/LoginPage";

describe("Login Page", () => {
  test("Login Page Buttons and Fields are Visible", () => {
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );

    const Login = screen.getByRole("button", {
      name: /Login/i,
    });
    expect(Login).toBeInTheDocument();
    expect(Login).toBeVisible();

    const Email = screen.getByRole('textbox', { placeholder: 'Email' });
    expect(Email).toBeInTheDocument();
    expect(Email).toBeVisible();

    const Password = screen.getByRole('textbox', { placeholder: 'Password' });
    expect(Password).toBeInTheDocument();
    expect(Password).toBeVisible();
  });

  test("Signup Page Buttons and Fields are Visible", () => {
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );

    const Signup = screen.getByRole("button", {
      name: /Sign Up/i,
    });
    expect(Signup).toBeInTheDocument();
    expect(Signup).toBeVisible();

    const Name = screen.getByRole('textbox', { placeholder: 'Name' });
    expect(Name).toBeInTheDocument();
    expect(Name).toBeVisible();

    const Email = screen.getByRole('textbox', { placeholder: 'Email' });
    expect(Email).toBeInTheDocument();
    expect(Email).toBeVisible();

    const Password = screen.getByRole('textbox', { placeholder: 'Password' });
    expect(Password).toBeInTheDocument();
    expect(Password).toBeVisible();
  });
});
