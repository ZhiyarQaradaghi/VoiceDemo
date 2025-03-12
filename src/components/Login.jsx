import React, { useState } from "react";
import { Box, TextField, Button, Typography, Paper } from "@mui/material";

function Login({ onLogin }) {
  const [username, setUsername] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username.trim()) {
      onLogin(username);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        width: "100vw",
        position: "absolute",
        top: 0,
        left: 0,
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          maxWidth: "400px",
          width: "90%",
        }}
      >
        <Typography component="h1" variant="h5" align="center" gutterBottom>
          Voice Chat App
        </Typography>
        <Typography variant="body1" align="center" sx={{ mb: 3 }}>
          Enter your username to continue
        </Typography>

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="username"
            label="Username"
            name="username"
            autoFocus
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={!username.trim()}
          >
            Join Chat
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}

export default Login;
