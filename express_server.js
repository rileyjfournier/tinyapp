const express = require("express");
const bodyParser = require("body-parser");
const cookieSession = require("cookie-session");
const bcrypt = require("bcrypt");
const app = express();
const PORT = 8080;

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: "session",
  keys: ["key1", "key2"]
}))


const urlDatabase = {
  // "b2xVn2": { longURL: "http://www.lighthouselabs.ca", userID: "id_goes_here"},
  // "9sm5xK": { longURL: "http://www.google.com", userID: "id_goes_here"},
  // "1245xK": { longURL: "http://www.google.ca", userID: "othername"}
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "yadayada"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "moreyada"
  }
};

// this function will return an object identical to urlDatabase,
// but will only include urls from specified userID
function urlsForUser(id) {
  let usersUrls = [];
  let usersDatabase = {};
  for (const url in urlDatabase) {
    if (urlDatabase[url].userID === id) {
      usersUrls.push({longURL: urlDatabase[url].longURL, shortURL: url});
    }
  }
  for (const obj of usersUrls) {
    usersDatabase[obj.shortURL] = { longURL: obj.longURL, userID: id };
  }
  return usersDatabase;
}

function loginChecker(email, password) {
  let emailMatch = false;
  let passwordMatch = false;
  let user_id;
  for (const id in users) {
    if (users[id].email === email) {
      emailMatch = true;
      user_id = id;
    }
    if (bcrypt.compareSync(password, users[id].password)) {
      passwordMatch = true;
    }
  }
  if (emailMatch === true && passwordMatch === true) {
    return user_id;
  } else {
    return false;
  }
}

function generateRandomString() {
  let string = "";
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const characters_length = characters.length;
  for (let i = 0; i < 6; i++) {
    string += characters.charAt(Math.floor(Math.random() * characters_length));
  }
  return string;
}

function alreadyRegisteredCheck(email) {
  for (const id in users) {
    if (users[id].email === email) {
      return false;
    }
  }
}

// page displaying all shortURLs with their original, longURL
app.get("/urls", (req, res) => {
  if (req.session.user_id === undefined) {
    res.redirect("/loginPrompt");
  } else {
    for (const user in users) {
      if (req.session.user_id === user) {
        const userUrlDatabase = urlsForUser(user);
        const templateVars = {
          user: users[req.session.user_id],
          urls: userUrlDatabase
        };
        res.render("urls_index", templateVars);
        break;
      }
    }
  }
});


// if user isn't logged in and is trying to use app, prompts to register or login
app.get("/loginPrompt", (req, res) => {
  const templateVars = {
    user: users[req.session.user_id]
  };
  res.render("loginPrompt", templateVars);
});


// login && logout with cookie management
app.get("/login", (req, res) => {
  const templateVars = {
    user: users[req.session.user_id]
  };
  res.render("login", templateVars);
});

app.post("/login", (req, res) => {
  if (loginChecker(req.body.email, req.body.password) === false) {
    res.sendStatus(403);
  } else {
    let currentUser;
    currentUser = loginChecker(req.body.email, req.body.password);
    req.session.user_id = currentUser;
    res.redirect("/urls");
  }
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});


// login button to link to login page
app.post("/loginLink", (req, res) => {
  res.redirect("/login");
});


// registration button to link to registration page
app.post("/registerLink", (req, res) => {
  res.redirect("/register");
});


// registration page
app.get("/register", (req, res) => {
  const templateVars = {
    user: users[req.session.user_id]
  };
  res.render("register", templateVars);
});

app.post("/register", (req, res) => {
  if (req.body.email.length === 0 || req.body.password.length === 0) {
    res.sendStatus(400);
  }
  if (alreadyRegisteredCheck(req.body.email) === false) {
    res.sendStatus(400);
  } else {
    const userID = generateRandomString();
    const password = req.body.password
    const hashedPassword = bcrypt.hashSync(password, 10);
    users[userID] = {
      id: userID,
      email: req.body.email,
      password: hashedPassword
    };
    req.session.user_id = userID;
    res.redirect("/urls");
  }
});


// page to create a new shortURL
app.get("/urls/new", (req, res) => {
  if (req.session.user_id === undefined) {
    res.redirect("/loginPrompt");
  } else {
    const templateVars = {
      user: users[req.session.user_id]
    };
    res.render("urls_new", templateVars);
  }
});

app.post("/urls/new", (req, res) => {
  if (req.session.user_id === undefined) {
    res.redirect("/loginPrompt");
  } else {
    const shortenedURL = generateRandomString();
    urlDatabase[shortenedURL] = { longURL: req.body.longURL, userID: req.session.user_id };
    res.redirect(`/urls/${shortenedURL}`);
  }
});


// displays information for a specific shortURL
app.get("/urls/:shortURL", (req, res) => {
  if (req.session.user_id === undefined) {
    res.redirect("/loginPrompt");
  } else {
    const templateVars = {
      user: users[req.session.user_id],
      shortURL: req.params.shortURL,
      longURL: urlDatabase[req.params.shortURL].longURL
    };
    res.render("urls_show", templateVars);
  }
});

app.get("/u/:shortURL", (req, res) => {  // clicking shortURL links to longURL
  const site =  urlDatabase[req.params.shortURL].longURL;
  res.redirect(site);
});

app.post("/urls/:shortURL", (req, res) => {
  if (urlDatabase[req.body.shortURL].userID === req.session.user_id) {
    urlDatabase[req.body.shortURL].longURL = req.body.longURL;
    res.redirect(`/urls/${req.body.shortURL}`);
  } else {
    res.sendStatus(403);
  }
});


// post method using edit button to redirect to specified shortURL for editing purposes
app.post("/urls/:shortURL/edit", (req, res) => {
  if (req.session.user_id === urlDatabase[req.params.shortURL].userID) {
    res.redirect(`/urls/${req.params.shortURL}`);
  } else {
    res.sendStatus(403);
  }
});


// post method with use of button (see urls_index.ejs for button incorportation) to delete any shortURL
app.post("/urls/:shortURL/delete", (req, res) => {
  if (req.session.user_id === urlDatabase[req.params.shortURL].userID) {
    delete urlDatabase[req.params.shortURL];
    res.redirect("/urls");
  } else {
    res.sendStatus(403);
  }
});



app.get("*", (req, res) => {
  res.redirect('/login');
});



app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});