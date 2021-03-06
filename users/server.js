const express = require('express');
// compatibility layer between Express & GraphQL
const expressGraphQL = require('express-graphql');
const schema = require('./schema/schema');

const app = express();

// GraphiQL is for development.
app.use('/graphql', expressGraphQL({
    schema,
    graphiql: true
}));

app.listen(4000, () => {
    console.log('Listening');
});
