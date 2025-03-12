import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Typography,
  TextField,
  IconButton,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Tooltip,
  Stack,
  Badge,
  Drawer,
  Fab,
  Chip,
  Button,
  useTheme,
  alpha,
  CircularProgress,
  Zoom,
  Slide,
} from "@mui/material";
import { keyframes } from "@emotion/react";
import { styled } from "@mui/material/styles";
import SendIcon from "@mui/icons-material/Send";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import PersonIcon from "@mui/icons-material/Person";
import ChatIcon from "@mui/icons-material/Chat";
import QueueIcon from "@mui/icons-material/Queue";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import CloseIcon from "@mui/icons-material/Close";
import PanToolIcon from "@mui/icons-material/PanTool";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import GraphicEqIcon from "@mui/icons-material/GraphicEq";
import ReactionButton from "./ReactionButton";

const SOCKET_SERVER =
  import.meta.env.VITE_SOCKET_SERVER || "http://localhost:5000";

const pulse = keyframes`
  0% {
    box-shadow: 0 0 0 0 ${alpha("#3f51b5", 0.7)};
    transform: scale(1);
  }
  
  70% {
    box-shadow: 0 0 0 15px ${alpha("#3f51b5", 0)};
    transform: scale(1.05);
  }
  
  100% {
    box-shadow: 0 0 0 0 ${alpha("#3f51b5", 0)};
    transform: scale(1);
  }
`;

const soundWave = keyframes`
  0% { height: 3px; }
  20% { height: 15px; }
  40% { height: 8px; }
  60% { height: 18px; }
  80% { height: 5px; }
  100% { height: 12px; }
`;

const floatUp = keyframes`
  0% {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
  100% {
    transform: translateY(-50px) scale(1.5);
    opacity: 0;
  }
`;

const popIn = keyframes`
  0% {
    transform: scale(0);
    opacity: 0;
  }
  70% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
`;

const SpeakingIndicator = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "50%",
  padding: theme.spacing(1),
  animation: `${pulse} 1.5s infinite`,
  backgroundColor: alpha(theme.palette.primary.main, 0.2),
}));

const WaveContainer = styled(Box)({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  height: 30,
  gap: 3,
  marginTop: 8,
});

const WaveBar = styled(Box)(({ delay, theme }) => ({
  width: 4,
  height: 3,
  borderRadius: 2,
  backgroundColor: theme.palette.primary.main,
  animation: `${soundWave} 1.2s ease-in-out infinite`,
  animationDelay: `${delay}s`,
}));

const AudioWave = () => (
  <WaveContainer>
    {[0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6].map((delay, i) => (
      <WaveBar key={i} delay={delay} />
    ))}
  </WaveContainer>
);

function ChatRoom({ socket, channelId, username, isMobile }) {
  const theme = useTheme();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [audioStream, setAudioStream] = useState(null);
  const [audioContext, setAudioContext] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [speakingQueue, setSpeakingQueue] = useState([]);
  const [currentSpeaker, setCurrentSpeaker] = useState(null);
  const [raisedHand, setRaisedHand] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const messagesEndRef = useRef(null);
  const [reactionAnimations, setReactionAnimations] = useState([]);

  useEffect(() => {
    fetch(`${SOCKET_SERVER}/api/channels/${channelId}/messages`)
      .then((response) => response.json())
      .then((data) => setMessages(data))
      .catch((error) => console.error("Error fetching messages:", error));
  }, [channelId]);

  useEffect(() => {
    if (!socket) return;

    socket.on("receive-message", (newMessage) => {
      setMessages((prevMessages) => [...prevMessages, newMessage]);
      if (!chatOpen) {
        setUnreadMessages((prev) => prev + 1);
      }
    });

    socket.on("user-joined", (data) => {
      setUsers(data.users);
    });

    socket.on("user-left", (data) => {
      setUsers(data.users);

      setSpeakingQueue((prev) =>
        prev.filter((user) => !data.leftUserId.includes(user.id))
      );

      if (currentSpeaker && data.leftUserId.includes(currentSpeaker.id)) {
        setCurrentSpeaker(null);
        moveQueueForward();
      }
    });

    socket.on("receive-voice-data", (data) => {
      if (audioContext) {
        const audioBuffer = new Float32Array(data.audioChunk);
        playAudio(audioBuffer);
      }
    });

    socket.on("queue-updated", (data) => {
      setSpeakingQueue(data.queue);
    });

    socket.on("current-speaker-updated", (data) => {
      setCurrentSpeaker(data.speaker);
    });

    socket.on("hand-raised", (data) => {
      if (data.userId === socket.id) {
        setRaisedHand(true);
      }
    });

    socket.on("hand-lowered", (data) => {
      if (data.userId === socket.id) {
        setRaisedHand(false);
      }
    });

    socket.on("reaction-received", (data) => {
      showReactionAnimation(data.type, data.username);
    });

    return () => {
      socket.off("receive-message");
      socket.off("user-joined");
      socket.off("user-left");
      socket.off("receive-voice-data");
      socket.off("queue-updated");
      socket.off("current-speaker-updated");
      socket.off("hand-raised");
      socket.off("hand-lowered");
      socket.off("reaction-received");
    };
  }, [socket, audioContext, chatOpen, currentSpeaker]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (chatOpen) {
      setUnreadMessages(0);
    }
  }, [chatOpen]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (message.trim() && socket) {
      socket.emit("send-message", {
        channelId,
        message,
        username,
      });
      setMessage("");
    }
  };

  const toggleMicrophone = async () => {
    if (currentSpeaker?.id !== socket?.id && !isRecording) {
      alert("You need to be the current speaker to use the microphone");
      return;
    }

    if (isRecording) {
      if (audioStream) {
        audioStream.getTracks().forEach((track) => track.stop());
        setAudioStream(null);
      }
      setIsRecording(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        setAudioStream(stream);

        const context = new (window.AudioContext ||
          window.webkitAudioContext)();
        setAudioContext(context);

        const source = context.createMediaStreamSource(stream);
        const processor = context.createScriptProcessor(1024, 1, 1);

        processor.onaudioprocess = (e) => {
          const audioData = e.inputBuffer.getChannelData(0);
          if (socket) {
            socket.emit("voice-data", {
              channelId,
              audioChunk: Array.from(audioData),
            });
          }
        };

        source.connect(processor);
        processor.connect(context.destination);

        setIsRecording(true);
      } catch (err) {
        console.error("Error accessing microphone:", err);
      }
    }
  };

  const playAudio = (audioData) => {
    if (!audioContext) return;

    const buffer = audioContext.createBuffer(
      1,
      audioData.length,
      audioContext.sampleRate
    );
    buffer.getChannelData(0).set(audioData);

    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);
    source.start();
  };

  const toggleChat = () => {
    setChatOpen(!chatOpen);
  };

  const raiseHand = () => {
    if (!raisedHand) {
      socket.emit("raise-hand", { channelId, username });
      setRaisedHand(true);
    } else {
      socket.emit("lower-hand", { channelId });
      setRaisedHand(false);
    }
  };

  const moveQueueForward = () => {
    if (speakingQueue.length > 0 && !currentSpeaker) {
      const nextSpeaker = speakingQueue[0];
      socket.emit("set-current-speaker", {
        channelId,
        speakerId: nextSpeaker.id,
      });

      socket.emit("remove-from-queue", {
        channelId,
        userId: nextSpeaker.id,
      });
    }
  };

  const showReactionAnimation = (type, username) => {
    const reactionEmojis = {
      like: "👍",
      love: "❤️",
      applause: "👏",
      celebrate: "🎉",
      fire: "🔥",
      perfect: "💯",
    };
    const emoji = reactionEmojis[type] || "👍";
    const id = Date.now();
    setReactionAnimations((prev) => [...prev, { id, emoji, username }]);
    setTimeout(() => {
      setReactionAnimations((prev) => prev.filter((anim) => anim.id !== id));
    }, 2000);
  };

  const sendReaction = (type) => {
    socket.emit("send-reaction", { channelId, username, type });
    showReactionAnimation(type, username);
  };

  const stringToColor = (string) => {
    let hash = 0;
    for (let i = 0; i < string.length; i++) {
      hash = string.charCodeAt(i) + ((hash << 5) - hash);
    }
    let color = "#";
    for (let i = 0; i < 3; i++) {
      const value = (hash >> (i * 8)) & 0xff;
      color += `00${value.toString(16)}`.slice(-2);
    }
    return color;
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100vh",
        overflow: "hidden",
        position: "relative",
        pt: isMobile ? 7 : 3,
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 2,
          width: isMobile ? "95%" : "90%",
          maxWidth: 800,
          maxHeight: isMobile ? 150 : 200,
          mb: 2,
          overflow: "auto",
          borderRadius: 2,
          background: alpha(theme.palette.background.paper, 0.8),
          backdropFilter: "blur(10px)",
        }}
      >
        <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
          <Typography variant="h6">Participants ({users.length})</Typography>
        </Box>
        <List>
          {users.map((user) => (
            <ListItem
              key={user.id}
              secondaryAction={
                currentSpeaker?.id === user.id && (
                  <Box
                    component="span"
                    sx={{
                      display: "inline-flex",
                      alignItems: "center",
                    }}
                  >
                    {isRecording && currentSpeaker?.id === user.id ? (
                      <GraphicEqIcon color="error" />
                    ) : (
                      <VolumeUpIcon color="primary" />
                    )}
                  </Box>
                )
              }
            >
              <ListItemAvatar>
                <Avatar
                  sx={{
                    bgcolor: stringToColor(user.username),
                    boxShadow:
                      currentSpeaker?.id === user.id
                        ? `0 0 0 2px ${theme.palette.primary.main}`
                        : "none",
                  }}
                >
                  {user.username.charAt(0).toUpperCase()}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={user.username}
                secondary={user.id === socket?.id ? "(You)" : ""}
                primaryTypographyProps={{
                  fontWeight:
                    currentSpeaker?.id === user.id ? "bold" : "regular",
                }}
              />
            </ListItem>
          ))}
        </List>
      </Paper>

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          maxWidth: isMobile ? "95%" : 800,
          p: isMobile ? 1 : 3,
        }}
      >
        <Zoom in={!!currentSpeaker} timeout={300}>
          <Paper
            elevation={4}
            sx={{
              p: 2,
              mb: 4,
              width: "100%",
              maxWidth: 500,
              textAlign: "center",
              borderRadius: 3,
              background: `linear-gradient(45deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
              color: "white",
              boxShadow: `0 8px 16px ${alpha(theme.palette.primary.main, 0.3)}`,
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 500 }}>
              {currentSpeaker?.username || "No one"} is speaking
            </Typography>
            {isRecording && currentSpeaker?.id === socket?.id && <AudioWave />}
          </Paper>
        </Zoom>

        <SpeakingIndicator
          sx={{
            mb: 4,
            animation: currentSpeaker ? `${pulse} 1.5s infinite` : "none",
          }}
        >
          <Fab
            color={
              isRecording
                ? "error"
                : currentSpeaker?.id === socket?.id
                ? "primary"
                : "default"
            }
            size="large"
            onClick={toggleMicrophone}
            sx={{
              width: 120,
              height: 120,
              transition: "all 0.3s ease",
              transform: isRecording ? "scale(1.05)" : "scale(1)",
              boxShadow: isRecording
                ? `0 0 30px ${alpha(theme.palette.error.main, 0.6)}`
                : currentSpeaker?.id === socket?.id
                ? `0 0 20px ${alpha(theme.palette.primary.main, 0.4)}`
                : `0 0 15px ${alpha(theme.palette.grey[800], 0.3)}`,
            }}
            disabled={currentSpeaker?.id !== socket?.id && !isRecording}
          >
            {isRecording ? (
              <MicIcon sx={{ fontSize: 60 }} />
            ) : (
              <MicOffIcon sx={{ fontSize: 60 }} />
            )}
          </Fab>
        </SpeakingIndicator>

        <Paper
          elevation={3}
          sx={{
            p: isMobile ? 2 : 3,
            width: "100%",
            maxWidth: isMobile ? "100%" : 600,
            mb: 3,
            borderRadius: 2,
            background: alpha(theme.palette.background.paper, 0.8),
            backdropFilter: "blur(10px)",
          }}
        >
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 500 }}>
            Speaking Queue
          </Typography>

          <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
            {speakingQueue.length > 0 ? (
              speakingQueue.map((user, index) => (
                <Chip
                  key={user.id}
                  avatar={
                    <Avatar sx={{ bgcolor: stringToColor(user.username) }}>
                      {user.username.charAt(0).toUpperCase()}
                    </Avatar>
                  }
                  label={`${index + 1}. ${user.username}`}
                  color={index === 0 ? "primary" : "default"}
                  variant={index === 0 ? "filled" : "outlined"}
                  sx={{
                    py: 0.5,
                    borderRadius: 2,
                    transition: "all 0.2s ease",
                    "&:hover": {
                      transform: "translateY(-2px)",
                      boxShadow: 1,
                    },
                  }}
                />
              ))
            ) : (
              <Typography color="text.secondary">Queue is empty</Typography>
            )}
          </Stack>
        </Paper>

        <Button
          variant={raisedHand ? "contained" : "outlined"}
          color={raisedHand ? "secondary" : "primary"}
          startIcon={<PanToolIcon />}
          onClick={raiseHand}
          sx={{
            mt: 2,
            px: 3,
            py: 1,
            borderRadius: 6,
            textTransform: "none",
            fontWeight: 500,
            boxShadow: raisedHand ? 3 : 0,
            transition: "all 0.2s ease",
            "&:hover": {
              transform: "translateY(-2px)",
              boxShadow: raisedHand ? 4 : 1,
            },
          }}
        >
          {raisedHand ? "Lower Hand" : "Raise Hand"}
        </Button>

        <Paper
          elevation={3}
          sx={{
            p: 2,
            mt: 2,
            width: "100%",
            maxWidth: isMobile ? "100%" : 600,
            borderRadius: 3,
            background: alpha(theme.palette.background.paper, 0.7),
            backdropFilter: "blur(10px)",
          }}
        >
          <Typography
            variant="subtitle1"
            gutterBottom
            fontWeight="500"
            textAlign="center"
          >
            Quick Reactions
          </Typography>
          <Stack
            direction="row"
            spacing={isMobile ? 0.5 : 1}
            justifyContent="center"
            flexWrap={isMobile ? "wrap" : "nowrap"}
          >
            <ReactionButton
              emoji="👍"
              tooltip="Like"
              type="like"
              onReact={sendReaction}
            />
            <ReactionButton
              emoji="❤️"
              tooltip="Love"
              type="love"
              onReact={sendReaction}
            />
            <ReactionButton
              emoji="👏"
              tooltip="Applause"
              type="applause"
              onReact={sendReaction}
            />
            <ReactionButton
              emoji="🎉"
              tooltip="Celebrate"
              type="celebrate"
              onReact={sendReaction}
            />
            <ReactionButton
              emoji="🔥"
              tooltip="Fire"
              type="fire"
              onReact={sendReaction}
            />
          </Stack>
        </Paper>
      </Box>

      <Zoom in={true}>
        <Fab
          color="primary"
          aria-label="chat"
          onClick={toggleChat}
          sx={{
            position: "absolute",
            bottom: 20,
            right: 20,
            transition: "all 0.3s ease",
            "&:hover": {
              transform: "scale(1.05)",
              boxShadow: 3,
            },
          }}
        >
          <Badge badgeContent={unreadMessages} color="error">
            <ChatIcon />
          </Badge>
        </Fab>
      </Zoom>

      <Drawer
        anchor="right"
        open={chatOpen}
        onClose={toggleChat}
        sx={{
          width: isMobile ? "100%" : 350,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: isMobile ? "100%" : 350,
            borderRadius: isMobile ? 0 : "16px 0 0 16px",
            boxShadow: "-5px 0 15px rgba(0,0,0,0.1)",
          },
        }}
      >
        <Box
          sx={{
            p: 2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="h6">Chat</Typography>
          <IconButton onClick={toggleChat}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Divider />

        {/* Messages */}
        <Box sx={{ flexGrow: 1, p: 2, overflowY: "auto" }}>
          <Stack spacing={2}>
            {messages.map((msg) => (
              <Box
                key={msg.id || msg.timestamp}
                sx={{
                  display: "flex",
                  justifyContent:
                    msg.sender === username ? "flex-end" : "flex-start",
                  mb: 1,
                }}
              >
                <Paper
                  elevation={1}
                  sx={{
                    p: 2,
                    minWidth: "200px",
                    maxWidth: "90%",
                    bgcolor:
                      msg.sender === username
                        ? alpha(theme.palette.primary.main, 0.9)
                        : alpha(theme.palette.background.paper, 0.9),
                    color: msg.sender === username ? "white" : "inherit",
                    borderRadius:
                      msg.sender === username
                        ? "16px 16px 4px 16px"
                        : "16px 16px 16px 4px",
                    boxShadow:
                      msg.sender === username
                        ? `0 4px 8px ${alpha(theme.palette.primary.main, 0.2)}`
                        : `0 2px 5px ${alpha(theme.palette.grey[500], 0.1)}`,
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    color={msg.sender === username ? "white" : "text.secondary"}
                    fontWeight="bold"
                  >
                    {msg.sender}
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 0.5, mb: 0.5 }}>
                    {msg.content}
                  </Typography>
                  <Typography
                    variant="caption"
                    color={
                      msg.sender === username
                        ? alpha(theme.palette.common.white, 0.7)
                        : "text.secondary"
                    }
                    display="block"
                    textAlign="right"
                  >
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Typography>
                </Paper>
              </Box>
            ))}
            <div ref={messagesEndRef} />
          </Stack>
        </Box>

        {/* Chat input */}
        <Box sx={{ p: 2, borderTop: 1, borderColor: "divider" }}>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <TextField
              fullWidth
              placeholder="Type a message..."
              variant="outlined"
              size="small"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage(e)}
              sx={{
                mr: 1,
                "& .MuiOutlinedInput-root": {
                  borderRadius: 4,
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
            <IconButton
              color="primary"
              onClick={handleSendMessage}
              disabled={!message.trim()}
              sx={{
                bgcolor: message.trim()
                  ? alpha(theme.palette.primary.main, 0.1)
                  : "transparent",
                transition: "all 0.2s ease",
                "&:hover": {
                  bgcolor: alpha(theme.palette.primary.main, 0.2),
                  transform: "scale(1.05)",
                },
              }}
            >
              <SendIcon />
            </IconButton>
          </Box>
        </Box>
      </Drawer>

      <Box
        sx={{
          position: "fixed",
          bottom: 100,
          right: 100,
          pointerEvents: "none",
          zIndex: 1000,
        }}
      >
        {reactionAnimations.map((anim) => (
          <Box
            key={anim.id}
            sx={{
              position: "absolute",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              animation: `${floatUp} 2s ease-out forwards`,
            }}
          >
            <Typography
              variant="caption"
              sx={{
                color: "text.secondary",
                fontSize: "0.7rem",
                animation: `${popIn} 0.3s ease-out`,
              }}
            >
              {anim.username}
            </Typography>
            <Typography
              sx={{
                fontSize: "2rem",
                animation: `${popIn} 0.3s ease-out`,
              }}
            >
              {anim.emoji}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

export default ChatRoom;
