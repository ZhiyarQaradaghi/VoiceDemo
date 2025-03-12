import React, { useState, useEffect } from "react";
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
  Divider,
  TextField,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Collapse,
  IconButton,
  Paper,
  alpha,
  useTheme,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ForumIcon from "@mui/icons-material/Forum";
import { styled } from "@mui/material/styles";

const SOCKET_SERVER =
  import.meta.env.VITE_SOCKET_SERVER || "http://localhost:5000";
const TOPICS = [
  "Art",
  "Technology",
  "Science",
  "Business",
  "Education",
  "Entertainment",
  "Health",
  "Politics",
];

const HeaderContainer = styled(Paper)(({ theme }) => ({
  position: "sticky",
  top: 0,
  zIndex: 10,
  padding: theme.spacing(2.5),
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
  boxShadow: `0 4px 20px ${alpha(theme.palette.primary.dark, 0.3)}`,
  borderRadius: "0 0 16px 16px",
  marginBottom: theme.spacing(2),
}));

const TopicHeader = styled(ListItem)(({ theme }) => ({
  backgroundColor: alpha(theme.palette.background.paper, 0.7),
  backdropFilter: "blur(10px)",
  borderRadius: theme.spacing(1),
  margin: `${theme.spacing(1)} ${theme.spacing(1)} 0`,
  transition: "all 0.2s ease",
  "&:hover": {
    backgroundColor: alpha(theme.palette.background.paper, 0.9),
    transform: "translateY(-2px)",
  },
}));

const ChannelItem = styled(ListItemButton)(({ theme, selected }) => ({
  borderRadius: theme.spacing(1),
  margin: `${theme.spacing(0.5)} ${theme.spacing(1)}`,
  transition: "all 0.2s ease",
  backgroundColor: selected
    ? alpha(theme.palette.primary.main, 0.15)
    : "transparent",
  "&:hover": {
    backgroundColor: selected
      ? alpha(theme.palette.primary.main, 0.25)
      : alpha(theme.palette.action.hover, 0.1),
    transform: "translateY(-2px)",
    boxShadow: selected
      ? `0 4px 8px ${alpha(theme.palette.primary.main, 0.2)}`
      : "0 2px 5px rgba(0,0,0,0.05)",
  },
}));

const CreateButton = styled(Button)(({ theme }) => ({
  borderRadius: theme.spacing(5),
  minWidth: "auto",
  padding: theme.spacing(1),
  boxShadow: `0 4px 8px ${alpha(theme.palette.common.black, 0.2)}`,
  transition: "all 0.2s ease",
  "&:hover": {
    transform: "translateY(-2px)",
    boxShadow: `0 6px 12px ${alpha(theme.palette.common.black, 0.25)}`,
  },
}));

function ChannelList({ channels, onJoinChannel, currentChannel }) {
  const theme = useTheme();
  const [openDialog, setOpenDialog] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const [newChannelDesc, setNewChannelDesc] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("");
  const [expandedTopics, setExpandedTopics] = useState({});

  useEffect(() => {
    const initialExpandedState = {};

    channels.forEach((channel) => {
      const topic = channel.topic || "General";
      initialExpandedState[topic] = true;
    });

    setExpandedTopics(initialExpandedState);
  }, [channels]);

  const handleCreateChannel = async () => {
    try {
      const response = await fetch(`${SOCKET_SERVER}/api/channels`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newChannelName,
          description: newChannelDesc,
          topic: selectedTopic || "General",
        }),
      });

      if (response.ok) {
        setOpenDialog(false);
        setNewChannelName("");
        setNewChannelDesc("");
        setSelectedTopic("");
      }
    } catch (error) {
      console.error("Error creating channel:", error);
    }
  };

  const channelsByTopic = channels.reduce((acc, channel) => {
    const topic = channel.topic || "General";
    if (!acc[topic]) {
      acc[topic] = [];
    }
    acc[topic].push(channel);
    return acc;
  }, {});

  const toggleTopic = (topic) => {
    setExpandedTopics((prev) => ({
      ...prev,
      [topic]: !prev[topic],
    }));
  };

  return (
    <Box
      sx={{
        width: 280,
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        borderRight: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
        background: alpha(theme.palette.background.paper, 0.8),
        backdropFilter: "blur(10px)",
        boxShadow: `4px 0 15px ${alpha(theme.palette.common.black, 0.05)}`,
      }}
    >
      <HeaderContainer elevation={0}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <ForumIcon
            sx={{
              fontSize: 32,
              color: alpha(theme.palette.common.white, 0.95),
            }}
          />
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: alpha(theme.palette.common.white, 0.95),
              letterSpacing: "0.5px",
              textShadow: "0 2px 4px rgba(0,0,0,0.1)",
            }}
          >
            Discussion Channels
          </Typography>
        </Box>
        <CreateButton
          color="secondary"
          variant="contained"
          onClick={() => setOpenDialog(true)}
          aria-label="Create new channel"
          sx={{
            width: 42,
            height: 42,
            minWidth: 42,
          }}
        >
          <AddIcon />
        </CreateButton>
      </HeaderContainer>

      <Box sx={{ overflowY: "auto", flexGrow: 1, p: 1 }}>
        {Object.keys(channelsByTopic).length > 0 ? (
          Object.entries(channelsByTopic).map(([topic, topicChannels]) => (
            <Paper
              key={topic}
              elevation={0}
              sx={{
                mb: 2,
                overflow: "hidden",
                bgcolor: "transparent",
              }}
            >
              <TopicHeader onClick={() => toggleTopic(topic)} disablePadding>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    width: "100%",
                    px: 2,
                    py: 1,
                  }}
                >
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontWeight: 600,
                      color: theme.palette.text.primary,
                      flexGrow: 1,
                    }}
                  >
                    {topic}
                  </Typography>
                  <Chip
                    size="small"
                    label={topicChannels.length}
                    sx={{
                      fontWeight: 600,
                      mr: 1,
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                    }}
                  />
                  <IconButton edge="end" size="small">
                    {expandedTopics[topic] ? (
                      <ExpandLessIcon fontSize="small" />
                    ) : (
                      <ExpandMoreIcon fontSize="small" />
                    )}
                  </IconButton>
                </Box>
              </TopicHeader>

              <Collapse
                in={expandedTopics[topic] !== false}
                timeout="auto"
                sx={{ mt: 0.5 }}
              >
                <List component="div" disablePadding>
                  {topicChannels.map((channel) => (
                    <ChannelItem
                      key={channel._id}
                      selected={currentChannel === channel._id}
                      onClick={() => onJoinChannel(channel._id)}
                      sx={{ pl: 3 }}
                    >
                      <ListItemText
                        primary={
                          <Typography
                            variant="body1"
                            sx={{
                              fontWeight:
                                currentChannel === channel._id ? 600 : 400,
                              color:
                                currentChannel === channel._id
                                  ? theme.palette.primary.main
                                  : theme.palette.text.primary,
                            }}
                          >
                            {channel.name}
                          </Typography>
                        }
                        secondary={
                          <Typography
                            variant="caption"
                            sx={{
                              display: "block",
                              mt: 0.5,
                              color: theme.palette.text.secondary,
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {channel.description}
                          </Typography>
                        }
                      />
                      {channel.activeUsers > 0 && (
                        <Chip
                          size="small"
                          label={channel.activeUsers}
                          color="primary"
                          sx={{
                            height: 24,
                            borderRadius: 12,
                            fontWeight: 600,
                            boxShadow:
                              currentChannel === channel._id
                                ? `0 0 10px ${alpha(
                                    theme.palette.primary.main,
                                    0.4
                                  )}`
                                : "none",
                          }}
                        />
                      )}
                    </ChannelItem>
                  ))}
                </List>
              </Collapse>
            </Paper>
          ))
        ) : (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              p: 4,
              opacity: 0.6,
            }}
          >
            <ForumIcon sx={{ fontSize: 60, mb: 2, opacity: 0.4 }} />
            <Typography variant="body1" textAlign="center">
              No discussion channels available
            </Typography>
            <Button
              variant="outlined"
              size="small"
              sx={{ mt: 2 }}
              onClick={() => setOpenDialog(true)}
            >
              Create a new channel
            </Button>
          </Box>
        )}
      </Box>

      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          elevation: 24,
          sx: {
            borderRadius: 2,
            bgcolor: alpha(theme.palette.background.paper, 0.95),
            backdropFilter: "blur(20px)",
          },
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Create New Discussion Channel
          </Typography>
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Channel Name"
            fullWidth
            value={newChannelName}
            onChange={(e) => setNewChannelName(e.target.value)}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
              },
            }}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={3}
            value={newChannelDesc}
            onChange={(e) => setNewChannelDesc(e.target.value)}
            sx={{
              mt: 2,
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
              },
            }}
          />
          <FormControl fullWidth margin="dense" sx={{ mt: 2 }}>
            <InputLabel>Topic</InputLabel>
            <Select
              value={selectedTopic}
              label="Topic"
              onChange={(e) => setSelectedTopic(e.target.value)}
              sx={{ borderRadius: 2 }}
            >
              <MenuItem value="">
                <em>General</em>
              </MenuItem>
              {TOPICS.map((topic) => (
                <MenuItem key={topic} value={topic}>
                  {topic}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setOpenDialog(false)} sx={{ borderRadius: 2 }}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateChannel}
            disabled={!newChannelName.trim()}
            variant="contained"
            sx={{
              borderRadius: 2,
              px: 3,
              boxShadow: `0 4px 10px ${alpha(theme.palette.primary.main, 0.3)}`,
            }}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default ChannelList;
