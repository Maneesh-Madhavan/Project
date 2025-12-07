const users = [];

const userJoin = (id, name, room, host, presenter) => {
  const user = { id, name, room, host, presenter };
  users.push(user);
  return user;
};

const userLeave = (id) => {
  const index = users.findIndex(u => u.id === id);
  if (index !== -1) return users.splice(index, 1)[0];
};

const getUsers = (room) => users.filter(u => u.room === room);

module.exports = { userJoin, userLeave, getUsers };
