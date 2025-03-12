import React, { useState } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  useTheme,
  useMediaQuery,
  Container,
  alpha,
  Avatar,
} from "@mui/material";
import ForumIcon from "@mui/icons-material/Forum";

function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

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
        width: "100%",
        position: "absolute",
        top: 0,
        left: 0,
        backgroundImage: `radial-gradient(${alpha(
          theme.palette.primary.main,
          0.05
        )} 1px, transparent 1px)`,
        backgroundSize: "20px 20px",
        p: isMobile ? 2 : 3,
      }}
    >
      <Container maxWidth="xs">
        <Paper
          elevation={6}
          sx={{
            p: isMobile ? 3 : 4,
            borderRadius: 2,
            background: alpha(theme.palette.background.paper, 0.9),
            backdropFilter: "blur(10px)",
            transition: "all 0.3s ease",
            transform: "translateY(0)",
            "&:hover": {
              boxShadow: `0 8px 40px ${alpha(
                theme.palette.common.black,
                0.12
              )}`,
              transform: "translateY(-5px)",
            },
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              mb: 3,
            }}
          >
            <Avatar
              sx={{
                width: 70,
                height: 70,
                bgcolor: theme.palette.primary.main,
                mb: 2,
                boxShadow: `0 4px 12px ${alpha(
                  theme.palette.primary.main,
                  0.3
                )}`,
              }}
            >
              <ForumIcon sx={{ fontSize: 40 }} />
            </Avatar>
            <Typography
              component="h1"
              variant={isMobile ? "h5" : "h4"}
              align="center"
              sx={{
                fontWeight: 700,
                letterSpacing: "0.5px",
                mb: 1,
              }}
            >
              Voice Chat App
            </Typography>
            <Typography
              variant="body1"
              align="center"
              sx={{
                color: theme.palette.text.secondary,
                maxWidth: "85%",
              }}
            >
              Enter your username to continue
            </Typography>
          </Box>

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
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                  transition: "all 0.2s ease",
                  "&.Mui-focused": {
                    boxShadow: `0 0 0 2px ${alpha(
                      theme.palette.primary.main,
                      0.2
                    )}`,
                  },
                },
              }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{
                mt: 3,
                mb: 2,
                py: 1.2,
                borderRadius: 2,
                fontWeight: 600,
                textTransform: "none",
                fontSize: "1rem",
                boxShadow: `0 4px 12px ${alpha(
                  theme.palette.primary.main,
                  0.3
                )}`,
                transition: "all 0.3s ease",
                "&:hover": {
                  boxShadow: `0 6px 16px ${alpha(
                    theme.palette.primary.main,
                    0.4
                  )}`,
                  transform: "translateY(-2px)",
                },
              }}
              disabled={!username.trim()}
            >
              Join Chat
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}

export default Login;
