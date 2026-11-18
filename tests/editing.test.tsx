import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { StudentDetails } from "../components/operations/students";
import { useOperationsModel } from "../components/operations/workspace";
import { PaginatedTable } from "../components/operations/table";
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/students",
}));

function StudentEditor({ id }: { id: string }) {
  const model = useOperationsModel({ screen: "students", studentId: id });
  return (
    <>
      {StudentDetails(model, model.detail!)}
      {model.message && <p role="status">{model.message}</p>}
    </>
  );
}
it("makes another employee’s locked student read-only", () => {
  render(<StudentEditor id="stu-1" />);
  expect(screen.getByLabelText("First name")).toBeDisabled();
  expect(
    screen.getByRole("button", { name: "Release my lock" }),
  ).toBeDisabled();
});
it("updates an unlocked student and rejects an empty name", () => {
  render(<StudentEditor id="stu-2" />);
  const input = screen.getByLabelText("First name");
  fireEvent.change(input, { target: { value: "Demo Leo" } });
  expect(input).toHaveValue("Demo Leo");
  fireEvent.change(input, { target: { value: "" } });
  expect(input).toHaveValue("Demo Leo");
  expect(screen.getByRole("status")).toHaveTextContent(
    "Name must not be empty",
  );
});
it("paginates the entire dataset including the final partial page", () => {
  render(
    <PaginatedTable>
      <table>
        <tbody>
          {Array.from({ length: 12 }, (_, i) => (
            <tr key={i}>
              <td>Record {i + 1}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </PaginatedTable>,
  );
  expect(screen.queryByText("Record 6")).toBeNull();
  fireEvent.click(screen.getByText("Next"));
  expect(screen.getByText("Record 6")).toBeInTheDocument();
  fireEvent.click(screen.getByText("Next"));
  expect(screen.getByText("Record 12")).toBeInTheDocument();
  expect(screen.getByText("Next")).toBeDisabled();
});
