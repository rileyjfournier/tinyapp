const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const app = express();
const PORT = 8080;

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());


const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
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

function loginChecker(email, password) {
  let emailMatch = false; 
  let passwordMatch = false;
  let user_id;
  for (const id in users) {
    if (users[id].email === email) {
      emailMatch = true;
    }
    if (users[id].password === password) {
      user_id = id;
      passwordMatch = true;
    }
  }
  if (emailMatch === true && passwordMatch === true) {
    return user_id;
  } else {
    return false;
  }
};

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
  const templateVars = { 
    user: users[req.cookies['user_id']],
    urls: urlDatabase 
  };
  res.render("urls_index", templateVars);
});


// login && logout with cookie management 
app.get("/login", (req, res) => {
  const templateVars = { 
    user: users[req.cookies['user_id']]
  };
  res.render("login", templateVars);
});

app.post("/login", (req, res) => {
  if (loginChecker(req.body.email, req.body.password) === false) {
    res.sendStatus(403)
  } else {
    let currentUser;
    currentUser = loginChecker(req.body.email, req.body.password);
    res.cookie("user_id", currentUser);
    res.redirect("/urls");
  }
})

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
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
    user: users[req.cookies['user_id']]
  };
  res.render("register", templateVars);
});

app.post("/register", (req, res) => {
  if (req.body.email.length === 0 || req.body.password.length === 0) {   // make me into a function *******
    res.sendStatus(400);
  }
  if (alreadyRegisteredCheck(req.body.email) === false) {
    res.sendStatus(400);
  } else {
    const userID = generateRandomString();
    users[userID] = {
      id: userID,
      email: req.body.email,
      password: req.body.password
    };
    res.cookie("user_id", userID);
    res.redirect("/urls");
  }
});


// page to create a new shortURL
app.get("/urls/new", (req, res) => {
  const templateVars = { 
    user: users[req.cookies['user_id']]
  };
  res.render("urls_new", templateVars);
});

app.post("/urls/new", (req, res) => {
  if (req.cookies['user_id']) {
    const shortenedURL = generateRandomString();
    urlDatabase[shortenedURL] = req.body.longURL;
    res.redirect(`/urls/${shortenedURL}`);
  } else {
    res.redirect(`/login`)
  }
});


// displays information for a specific shortURL
app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { 
    user: users[req.cookies['user_id']],
    shortURL: req.params.shortURL, 
    longURL: urlDatabase[req.params.shortURL] 
  };
  res.render("urls_show", templateVars);
});
app.get("/u/:shortURL", (req, res) => {  // clicking shortURL links to longURL
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});
app.post("/urls/:shortURL", (req, res) => {
  urlDatabase[req.body.shortURL] = req.body.longURL;
  res.redirect(`/urls/${req.body.shortURL}`);
});


// post method using edit button to redirect to specified shortURL for editing purposes
app.post("/urls/:shortURL/edit", (req, res) => {
  res.redirect(`/urls/${req.params.shortURL}`);
});


// post method with use of button (see urls_index.ejs for button incorportation) to delete any shortURL
app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});





// other routes ...
app.get("/", (req, res) => {
  res.send("Hello!");
});



app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});



app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});



app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});