import gql from 'graphql-tag';

const typeDefs = gql`
  type MenuItem {
    id: ID!
    name: String!
    description: String
    price: Float!
    restaurantId: ID!
  }

  type Restaurant {
    id: ID!
    name: String!
    address: String!
    description: String
    menus: [MenuItem!]!
  }

  type Query {
    restaurants: [Restaurant!]!
    restaurant(id: ID!): Restaurant
    menu(restaurantId: ID!): [MenuItem!]!
  }

  input CreateRestaurantInput {
    name: String!
    address: String!
    description: String
  }

  input CreateMenuItemInput {
    name: String!
    description: String
    price: Float!
    restaurantId: ID!
  }

  type Mutation {
    createRestaurant(input: CreateRestaurantInput!): Restaurant!
    createMenuItem(input: CreateMenuItemInput!): MenuItem!
  }
`;

export default typeDefs;
