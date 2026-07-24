import { defineMcp } from "@lovable.dev/mcp-js";
import listAppointments from "./tools/list-appointments";
import createAppointment from "./tools/create-appointment";
import deleteAppointment from "./tools/delete-appointment";

export default defineMcp({
  name: "sameh-appointments-mcp",
  title: "Dr. Sameh Appointments",
  version: "0.1.0",
  instructions:
    "Tools to manage appointments for Dr. Sameh's clinic. Use `list_appointments` to read history, `create_appointment` to book, and `delete_appointment` to remove one by id.",
  tools: [listAppointments, createAppointment, deleteAppointment],
});
