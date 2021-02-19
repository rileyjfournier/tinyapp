const getUserByEmail = function(email, database) {
  for (const id in database) {
    if (database[id].email === email) {
      return id;
    }
  }
}

const generateRandomString = function() {
  let string = "";
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const characters_length = characters.length;
  for (let i = 0; i < 6; i++) {
    string += characters.charAt(Math.floor(Math.random() * characters_length));
  }
  return string;
}


module.exports = { getUserByEmail, generateRandomString };