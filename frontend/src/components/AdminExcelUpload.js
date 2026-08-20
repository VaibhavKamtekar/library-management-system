import { useState } from "react";
import axios from "axios";
import {
  Container,
  Paper,
  Typography,
  Button,
  Stack
} from "@mui/material";

export default function AdminExcelUpload() {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage("Please select an Excel file");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post(
        "http://localhost:5000/api/admin/upload-students",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data"
          }
        }
      );

      setMessage(
        `Upload successful: ${res.data.inserted} students added`
      );
    } catch (err) {
      setMessage("Excel upload failed");
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 6 }}>
      <Paper elevation={6} sx={{ p: 4, textAlign: "center" }}>
        <Typography variant="h6" gutterBottom>
          📥 Upload Students via Excel
        </Typography>

        <Stack spacing={2} mt={2}>
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
          />

          <Button
            variant="contained"
            color="primary"
            onClick={handleUpload}
          >
            Upload Excel
          </Button>

          {message && (
            <Typography color="secondary">
              {message}
            </Typography>
          )}
        </Stack>
      </Paper>
    </Container>
  );
}
