export const mockUsers = [
    { label: 'John', id: 'user1' },
    { label: 'Bob', id: 'user2' },
    { label: 'Patrick', id: 'user3' },
    { label: 'Jake', id: 'user4' },
    { label: 'Sarah', id: 'user5' },
    { label: 'Alice', id: 'user6' },
    { label: 'Eve', id: 'user7' },
    { label: 'Mallory', id: 'user8' },
    { label: 'Trent', id: 'user9' },
    { label: 'Carol', id: 'user10' },
  ];
  
  export const mockChats = [
    { id: 'chat1', recipient: ['John'], messages: [{sender: 'John', content: 'Hi Patrick, how are you?', timestamp: new Date().toISOString(), unread: false}, {sender: 'Patrick', content: 'Hello John', timestamp: new Date().toISOString(), unread: true}] },
    { id: 'chat2', recipient: ['Bob'], messages: [{sender: 'Bob', content: 'Hey Bob, got a minute?', timestamp: new Date().toISOString(), unread: true}] },
  ];
  