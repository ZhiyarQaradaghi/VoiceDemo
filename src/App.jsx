import React, { useState, useEffect } from "react";
import {
  CssBaseline,
  ThemeProvider,
  createTheme,
  Box,
  useMediaQuery,
  IconButton,
  Drawer,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { io } from "socket.io-client";
import Login from "./components/Login";
import ChannelList from "./components/ChannelList";
import ChatRoom from "./components/ChatRoom";

const darkTheme = createTheme({
  palette: {
    mode: "dark",
  },
});

const SOCKET_SERVER =
  import.meta.env.VITE_SOCKET_SERVER || "http://localhost:5000";

function App() {
  const [socket, setSocket] = useState(null);
  const [username, setUsername] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [channels, setChannels] = useState([]);
  const [currentChannel, setCurrentChannel] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isMobile = useMediaQuery(darkTheme.breakpoints.down("sm"));

  useEffect(() => {
    const newSocket = io(SOCKET_SERVER);
    setSocket(newSocket);
    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (loggedIn) {
      fetch(`${SOCKET_SERVER}/api/channels`)
        .then((response) => response.json())
        .then((data) => setChannels(data))
        .catch((error) => console.error("Error fetching channels:", error));
    }
  }, [loggedIn]);

  const handleLogin = (name) => {
    setUsername(name);
    setLoggedIn(true);
  };

  const handleJoinChannel = (channelId) => {
    if (currentChannel) {
      socket.emit("leave-channel", currentChannel);
    }

    setCurrentChannel(channelId);
    socket.emit("join-channel", channelId, username);

    // Close drawer after channel selection on mobile
    if (isMobile) {
      setDrawerOpen(false);
    }
  };

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Box sx={{ width: "100vw", height: "100vh", overflow: "hidden" }}>
        {!loggedIn ? (
          <Login onLogin={handleLogin} />
        ) : (
          <Box sx={{ display: "flex", height: "100vh", width: "100%" }}>
            {/* Mobile menu button */}
            {isMobile && currentChannel && (
              <IconButton
                color="primary"
                aria-label="open channels"
                onClick={toggleDrawer}
                sx={{
                  position: "absolute",
                  top: 10,
                  left: 10,
                  zIndex: 1200,
                  bgcolor: "background.paper",
                  boxShadow: 2,
                  "&:hover": { bgcolor: "background.default" },
                }}
              >
                <MenuIcon />
              </IconButton>
            )}

            {/* Channel list - drawer on mobile, sidebar on desktop */}
            {isMobile ? (
              <Drawer
                anchor="left"
                open={drawerOpen}
                onClose={toggleDrawer}
                sx={{
                  "& .MuiDrawer-paper": {
                    width: 280,
                    boxSizing: "border-box",
                  },
                }}
              >
                <ChannelList
                  channels={channels}
                  onJoinChannel={handleJoinChannel}
                  currentChannel={currentChannel}
                />
              </Drawer>
            ) : (
              <ChannelList
                channels={channels}
                onJoinChannel={handleJoinChannel}
                currentChannel={currentChannel}
              />
            )}

            {currentChannel && (
              <ChatRoom
                socket={socket}
                channelId={currentChannel}
                username={username}
                isMobile={isMobile}
              />
            )}

            {isMobile && !currentChannel && (
              <Box sx={{ width: "100%" }}>
                <ChannelList
                  channels={channels}
                  onJoinChannel={handleJoinChannel}
                  currentChannel={currentChannel}
                />
              </Box>
            )}
          </Box>
        )}
      </Box>
    </ThemeProvider>
  );
}

export default App;
