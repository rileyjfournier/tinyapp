const express = require("express");
const bodyParser = require("body-parser");
const cookieSession = require("cookie-session");
const bcrypt = require("bcrypt");

const { getUserByEmail, generateRandomString, } = require("./helpers");

const app = express();
const PORT = 8080;

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: "session",
  keys: ["key1", "key2"]
}));

const urlDatabase = {};

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

// if email and password matches, this function will return user_id, else return false
const loginChecker = function(email, password) {
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
};

// this function will return an object identical to urlDatabase,
// but will only include urls from specified userID
const urlsForUser = function(id) {
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
};



// ***
// /URL ENDPOINTS
// ***

app.get("/urls", (req, res) => {
  if (!req.session.user_id) {
    const templateVars = {
      user: users[req.session.user_id]
    };
    res.render("err400", templateVars);
    return;
  } 
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
});


app.post("/urls", (req, res) => {
  if (!req.session.user_id) {
    res.redirect("/loginPrompt");
    return;
  } 
  const shortenedURL = generateRandomString();
  urlDatabase[shortenedURL] = { longURL: req.body.longURL, userID: req.session.user_id };
  res.redirect(`/urls/${shortenedURL}`);
});



// ***
// LOGIN && LOGOUT ENDPOINTS
// ***

// if user isn't logged in and is trying to use app, prompts to register or login
app.get("/loginPrompt", (req, res) => {
  const templateVars = {
    user: users[req.session.user_id]
  };
  res.render("loginPrompt", templateVars);
});


app.get("/login", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/urls");
    return;
  } 
  const templateVars = {
    user: users[req.session.user_id]
  };
  res.render("login", templateVars);
});


app.post("/login", (req, res) => {
  if (!loginChecker(req.body.email, req.body.password)) {
    const templateVars = {
      user: users[req.session.user_id]
    };
    res.render("err400", templateVars);
    return;
  } 
  let currentUser;
  currentUser = loginChecker(req.body.email, req.body.password);
  req.session.user_id = currentUser;
  res.redirect("/urls");
});


app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/loginPrompt");
});



// ***
// LOGIN && REGISTRATION LINK ENDPOINTS
// ***

app.post("/loginLink", (req, res) => {
  res.redirect("/login");
});


app.post("/registerLink", (req, res) => {
  res.redirect("/register");
});



// ***
// REGISTER ENDPOINTS
// ***

app.get("/register", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/urls");
    return;
  } 
  const templateVars = {
    user: users[req.session.user_id]
  };
  res.render("register", templateVars);
});


app.post("/register", (req, res) => {
  if (req.body.email.length === 0 || req.body.password.length === 0) {
    const templateVars = {
      user: users[req.session.user_id]
    };
    res.render("err400", templateVars);
    return;
  } 
  if (getUserByEmail(req.body.email, users)) {
    const templateVars = {
      user: users[req.session.user_id]
    };
    res.render("err400", templateVars);
    return;
  } 
  const userID = generateRandomString();
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);
  users[userID] = {
    id: userID,
    email: req.body.email,
    password: hashedPassword
  };
  req.session.user_id = userID;
  res.redirect("/urls");
});



// ***
// /URLS/NEW ENDPOINT
// ***

app.get("/urls/new", (req, res) => {
  if (!req.session.user_id) {
    res.redirect("/loginPrompt");
    return;
  } 
  const templateVars = {
    user: users[req.session.user_id]
  };
  res.render("urls_new", templateVars);
});



// ***
// SHORT_URL ENDPOINTS
// ***

app.get("/urls/:shortURL", (req, res) => {
  // if url exists, return true, else false
  const doesShortUrlExist = function() {
    let exists = false;
    for (const url in urlDatabase) {
      if (req.params.shortURL === url) {
        exists = true;
        break;
      }
    }
    return exists;
  };
  if (!doesShortUrlExist()) {
    const templateVars = {
      user: users[req.session.user_id]
    };
    res.render("err400", templateVars);
    return;
  }
  if (!req.session.user_id) {
    const templateVars = {
      user: users[req.session.user_id]
    };
    res.render("err400", templateVars);
    return;
  }
  if (req.session.user_id !== urlDatabase[req.params.shortURL].userID) {
    const templateVars = {
      user: users[req.session.user_id]
    };
    res.render("err400", templateVars);
    return;
  } 
  const templateVars = {
    user: users[req.session.user_id],
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL
  };
  res.render("urls_show", templateVars);
});


app.get("/u/:shortURL", (req, res) => { 
  if (!urlDatabase[req.params.shortURL].longURL) {
    const templateVars = {
      user: users[req.session.user_id]
    };
    res.render("err400", templateVars);
    return;
  } 
  const site =  urlDatabase[req.params.shortURL].longURL;
  res.redirect(site);
});


app.post("/urls/:shortURL", (req, res) => {
  if (urlDatabase[req.body.shortURL].userID !== req.session.user_id) {
    const templateVars = {
      user: users[req.session.user_id]
    };
    res.render("err403", templateVars);
    return;
  }
  if (!req.session.user_id) {
    const templateVars = {
      user: users[req.session.user_id]
    };
    res.render("err400", templateVars);
    return;
  } 
  urlDatabase[req.body.shortURL].longURL = req.body.longURL;
  res.redirect(`/urls`);
});


// ***
// EDIT && DELETE BUTTONS
// ***

app.post("/urls/:shortURL/edit", (req, res) => {
  if (req.session.user_id !== urlDatabase[req.params.shortURL].userID) {
    const templateVars = {
      user: users[req.session.user_id]
    };
    res.render("err403", templateVars);
    return;
  }
  res.redirect(`/urls/${req.params.shortURL}`);
});


app.post("/urls/:shortURL/delete", (req, res) => {
  if (req.session.user_id !== urlDatabase[req.params.shortURL].userID) {
    const templateVars = {
      user: users[req.session.user_id]
    };
    res.render("err403", templateVars);
    return;
  } 
  if (!req.session.user_id) {
    const templateVars = {
      user: users[req.session.user_id]
    };
    res.render("err400", templateVars);
    return;
  } 
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});



// ***
// ROOT && OTHER ENDPOINTS
// ***

app.get("/", (req, res) => {
  res.redirect("/login");
});

app.get("*", (req, res) => {
  res.redirect('/urls');
});



app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});