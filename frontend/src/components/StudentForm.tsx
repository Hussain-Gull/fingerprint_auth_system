import React from "react";

export default function StudentForm({ onSubmit }: { onSubmit: (data:any) => void }) {
  function handleSubmit(e:any){
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    onSubmit(data);
  }
  return (
    <form onSubmit={handleSubmit}>
      <input name="name" placeholder="Name" required />
      <input name="cnic_number" placeholder="CNIC" required />
      <input name="age" type="number" />
      <input name="father_name" placeholder="Father Name" />
      <input name="gender" placeholder="Gender" />
      <input name="country" placeholder="Country" />
      <input name="date_of_birth" type="date" />
      <textarea name="address" placeholder="Address" />
      <button type="submit">Next: Capture Fingerprint</button>
    </form>
  );
}
