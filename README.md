# GraphQL
GraphQL with React

## REST

URL       | Method | Operation
--------------------------------------
/posts    | POST   | Create a new post
/posts    | GET    | Fetch all posts
/posts/14 | GET    | Fetch post 14
/posts/15 | PUT    | Update post 15
/posts/18 | DELETE | Delete post 18

Associations:

`/users/23/posts/14` -> nesting records

But if we start nesting more information, the Rest URL is not as straight forward anymore.

* Determine relationships
* Too many HTTP requests (for different tables)
* We don't always want ALL the info (some times just parts of info)
* REST convention gets more complicated when composed data

## On to GraphQL

```graphql
query {
    user(id: "23") {
        friends {
            company {
                name
            }
        }
    }
}
```

Datastore <=> Express/GraphQL Server <=> GraphiQL

```bash
mkdir users
cd users
npm init
npm install --save express express-graphql graphql lodash
touch server.js
```

The Express server receives a request from browser and if it's GraphQL request, it's called and responds.

Very minimal Express server code:
```javascript
const express = require('express');

const app = express();

app.listen(4000, () => {
    console.log('Listening');
});
```

Adding GraphQL related code:

```javascript
const express = require('express');
// compatibility layer between Express & GraphQL
const expressGraphQL = require('express-graphql');

const app = express();

// GraphiQL is for development.
app.use('/graphql', expressGraphQL({
    graphiql: true
}));

app.listen(4000, () => {
    console.log('Listening');
});
```

If we run this code, it will return a Schema error.
```
node server.js
```

### GraphQL Schemas