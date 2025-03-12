import React, { useState } from "react";
import { useTheme } from "@mui/material/styles";
import { Box, IconButton, Tooltip } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { keyframes } from "@emotion/react";

const ReactionButton = ({ emoji, tooltip, type, onReact }) => {
  const theme = useTheme();
  const [animated, setAnimated] = useState(false);

  const handleClick = () => {
    setAnimated(true);
    onReact(type);

    setTimeout(() => setAnimated(false), 1000);
  };

  return (
    <Tooltip title={tooltip}>
      <Box
        sx={{
          position: "relative",
          display: "inline-flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <IconButton
          onClick={handleClick}
          sx={{
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            p: 1.5,
            fontSize: "1.5rem",
            transition: "all 0.2s ease",
            transform: animated ? "scale(1.4)" : "scale(1)",
            "&:hover": {
              bgcolor: alpha(theme.palette.primary.main, 0.2),
              transform: "scale(1.1)",
            },
          }}
        >
          {emoji}
        </IconButton>
        {animated && (
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              pointerEvents: "none",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {[...Array(6)].map((_, i) => (
              <Box
                key={i}
                sx={{
                  position: "absolute",
                  fontWeight: "bold",
                  fontSize: "1.5rem",
                  opacity: 0,
                  animation: `${popOut} 1s ease-out forwards`,
                  animationDelay: `${i * 0.1}s`,
                  color: theme.palette.primary.main,
                }}
              >
                {emoji}
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </Tooltip>
  );
};

const popOut = keyframes`
  0% {
    transform: translate(0, 0) scale(0.5);
    opacity: 1;
  }
  100% {
    transform: translate(${() => Math.random() * 40 - 20}px, -${() =>
  Math.random() * 50 + 20}px) scale(0);
    opacity: 0;
  }
`;

export default ReactionButton;
