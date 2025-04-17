import React from 'react';
import { Box, List, ListItem, ListItemAvatar, Avatar, ListItemText, TextField, Autocomplete, Badge } from '@mui/material';

const Chatside = ({ projectUsers, chats, setSelectedChat, currentUser }) => {
    const findChatForUser = (userName) => chats.find(chat => chat.recipient.includes(userName));

    return (
        <Box sx={{ width: '250px', borderRight: '1px solid #ccc', overflowY: 'auto' }}>
            <List>
                {projectUsers && projectUsers.filter(user => user.label !== currentUser).map((user) => {
                    const chatForUser = findChatForUser(user.label);
                    const hasUnreadMessages = chatForUser && chatForUser.messages.some(message => message.sender !== currentUser && message.unread);
                    if (chatForUser) {
                        return (
                            <ListItem button key={chatForUser.id} onClick={() => setSelectedChat(chatForUser)}>
                                <ListItemAvatar>
                                    <Badge variant="dot" color="error" invisible={!hasUnreadMessages}>
                                        <Avatar>{chatForUser.recipient && chatForUser.recipient.length > 0 && chatForUser.recipient[0][0]}</Avatar>
                                    </Badge>
                                </ListItemAvatar>
                                <ListItemText
                                    primary={chatForUser.recipient}
                                    secondary={chatForUser.messages.length > 0 ? chatForUser.messages[chatForUser.messages.length - 1].content : 'No messages'}
                                />
                            </ListItem>
                        )
                    } else {
                        return (
                            <ListItem button key={user.label} onClick={(event) => setSelectedChat(user.label)}>
                                <ListItemAvatar>
                                    <Avatar>{user.label[0]}</Avatar>
                                </ListItemAvatar>
                                <ListItemText primary={user.label} secondary="No messages" />
                            </ListItem>
                        )
                    }
                })}
            </List>
        </Box>
    );
};

export default Chatside;