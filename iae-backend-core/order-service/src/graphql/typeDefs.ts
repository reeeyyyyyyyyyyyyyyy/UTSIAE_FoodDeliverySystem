import gql from 'graphql-tag';

const typeDefs = gql`
  type OrderItem {
    id: ID!
    menuId: ID!
    quantity: Int!
    price: Float!
  }

  type Order {
    id: ID!
    userId: ID!
    restaurantId: ID!
    totalAmount: Float!
    status: String!
    items: [OrderItem!]!
  }

  input OrderItemInput {
    menuId: ID!
    quantity: Int!
    price: Float!
  }

  input CreateOrderInput {
    userId: ID!
    restaurantId: ID!
    items: [OrderItemInput!]!
  }

  type Query {
    order(id: ID!): Order
    userOrders(userId: ID!): [Order!]!
  }

  type Mutation {
    createOrder(input: CreateOrderInput!): Order!
  }
`;

export default typeDefs;
