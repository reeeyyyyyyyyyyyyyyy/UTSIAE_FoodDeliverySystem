import { gql } from 'apollo-server-core';

export const userTypeDefs = gql`
  type User {
    id: Int!
    name: String!
    email: String!
    phone: String
    role: String!
    createdAt: String!
    updatedAt: String!
  }

  type Address {
    id: Int!
    userId: Int!
    label: String!
    fullAddress: String!
    latitude: Float
    longitude: Float
    isDefault: Boolean!
    createdAt: String!
    updatedAt: String!
  }

  type AuthPayload {
    status: String!
    message: String!
    data: AuthData!
  }

  type AuthData {
    token: String!
  }

  type UserPayload {
    status: String!
    message: String!
    data: User!
  }

  type UserListPayload {
    status: String!
    data: [User!]!
  }

  type AddressPayload {
    status: String!
    message: String!
    data: Address!
  }

  type AddressListPayload {
    status: String!
    data: [Address!]!
  }

  input RegisterInput {
    name: String!
    email: String!
    password: String!
    phone: String
  }

  input LoginInput {
    email: String!
    password: String!
  }

  input CreateAddressInput {
    label: String!
    fullAddress: String!
    latitude: Float
    longitude: Float
    isDefault: Boolean
  }

  input UpdateAddressInput {
    label: String
    fullAddress: String
    latitude: Float
    longitude: Float
    isDefault: Boolean
  }

  type Query {
    # Public queries
    health: String!
    
    # Protected queries
    getProfile: UserPayload!
    getAddresses: AddressListPayload!
    getAddress(id: Int!): AddressPayload!
    
    # Admin queries
    getAllUsers(limit: Int, offset: Int): UserListPayload!
    getUserById(id: Int!): UserPayload!
  }

  type Mutation {
    # Auth mutations
    register(input: RegisterInput!): UserPayload!
    login(input: LoginInput!): AuthPayload!
    
    # Address mutations
    createAddress(input: CreateAddressInput!): AddressPayload!
    updateAddress(id: Int!, input: UpdateAddressInput!): AddressPayload!
    deleteAddress(id: Int!): String!
  }
`;
