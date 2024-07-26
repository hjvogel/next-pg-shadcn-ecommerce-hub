import { CartItem, PaymentResult, ShippingAddress } from '@/types'
import { relations } from 'drizzle-orm'
import {
  boolean,
  integer,
  json,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'
import { primaryKey } from 'drizzle-orm/pg-core/primary-keys'
import { AdapterAccountType } from 'next-auth/adapters'

// USERS - noo thy called user tabel use but export users - TOD migrate later
export const users = pgTable(
  'user',
  {
    id: uuid('id').defaultRandom().primaryKey().notNull(),
    name: text('name').notNull().default('NO_NAME'),
    email: text('email').notNull(),
    role: text('role').notNull().default('user'),
    password: text('password'),
    emailVerified: timestamp('emailVerified', { mode: 'date' }),
    image: text('image'),
    address: json('address').$type<ShippingAddress>(),
    paymentMethod: text('paymentMethod'),
    createdAt: timestamp('createdAt').defaultNow(),
  },
  (table) => {
    return {
      userEmailIdx: uniqueIndex('user_email_idx').on(table.email),
    }
  }
)

export const accounts = pgTable(
  'account',
  {
    userId: uuid('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').$type<AdapterAccountType>().notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('providerAccountId').notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: text('token_type'),
    scope: text('scope'),
    id_token: text('id_token'),
    session_state: text('session_state'),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  })
)

export const sessions = pgTable('session', {
  sessionToken: text('sessionToken').primaryKey(),
  userId: uuid('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
})

export const verificationTokens = pgTable(
  'verificationToken',
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: timestamp('expires', { mode: 'date' }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
  })
)

// PRODUCTS
export const products = pgTable(
  'product',
  {
    id: uuid('id').defaultRandom().primaryKey().notNull(),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    category: text('category').notNull(),
    images: text('images').array().notNull(),
    brand: text('brand').notNull(),
    description: text('description').notNull(),
    stock: integer('stock').notNull(),
    price: numeric('price', { precision: 12, scale: 2 }).notNull().default('0'),
    rating: numeric('rating', { precision: 3, scale: 2 })
      .notNull()
      .default('0'),
    numReviews: integer('numReviews').notNull().default(0),
    isFeatured: boolean('isFeatured').default(false).notNull(),
    banner: text('banner'),
    createdAt: timestamp('createdAt').defaultNow().notNull(),
  },
  (table) => {
    return {
      productSlugIdx: uniqueIndex('product_slug_idx').on(table.slug),
    }
  }
)

export const reviews = pgTable('reviews', {
  id: uuid('id').defaultRandom().primaryKey().notNull(),
  userId: uuid('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  productId: uuid('productId')
    .notNull()
    .references(() => products.id, { onDelete: 'cascade' }),
  rating: integer('rating').notNull(),
  title: text('title').notNull(),
  description: text('slug').notNull(),
  isVerifiedPurchase: boolean('isVerifiedPurchase').notNull().default(true),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
})
export const productRelations = relations(products, ({ many }) => ({
  reviews: many(reviews),
}))
export const reviewsRelations = relations(reviews, ({ one }) => ({
  user: one(users, { fields: [reviews.userId], references: [users.id] }),
  product: one(products, {
    fields: [reviews.productId],
    references: [products.id],
  }),
}))

// CARTS
export const carts = pgTable('cart', {
  id: uuid('id').notNull().defaultRandom().primaryKey(),
  userId: uuid('userId').references(() => users.id, {
    onDelete: 'cascade',
  }),
  sessionCartId: text('sessionCartId').notNull(),
  items: json('items').$type<CartItem[]>().notNull().default([]),
  itemsPrice: numeric('itemsPrice', { precision: 12, scale: 2 }).notNull(),
  shippingPrice: numeric('shippingPrice', {
    precision: 12,
    scale: 2,
  }).notNull(),
  taxPrice: numeric('taxPrice', { precision: 12, scale: 2 }).notNull(),
  totalPrice: numeric('totalPrice', { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
})

// ORDERS
export const orders = pgTable('order', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  shippingAddress: json('shippingAddress').$type<ShippingAddress>().notNull(),
  paymentMethod: text('paymentMethod').notNull(),
  paymentResult: json('paymentResult').$type<PaymentResult>(),
  itemsPrice: numeric('itemsPrice', { precision: 12, scale: 2 }).notNull(),
  shippingPrice: numeric('shippingPrice', {
    precision: 12,
    scale: 2,
  }).notNull(),
  taxPrice: numeric('taxPrice', { precision: 12, scale: 2 }).notNull(),
  totalPrice: numeric('totalPrice', { precision: 12, scale: 2 }).notNull(),
  isPaid: boolean('isPaid').notNull().default(false),
  paidAt: timestamp('paidAt'),
  isDelivered: boolean('isDelivered').notNull().default(false),
  deliveredAt: timestamp('deliveredAt'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
})
export const ordersRelations = relations(orders, ({ one, many }) => ({
  orderItems: many(orderItems),
  user: one(users, { fields: [orders.userId], references: [users.id] }),
}))

export const orderItems = pgTable(
  'orderItems',
  {
    orderId: uuid('orderId')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    productId: uuid('productId')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    qty: integer('qty').notNull(),
    price: numeric('price', { precision: 12, scale: 2 }).notNull(),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    image: text('image').notNull(),
  },
  (orderItem) => ({
    compoundKey: primaryKey({
      columns: [orderItem.orderId, orderItem.productId],
    }),
  })
)

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
}))

// merge with legacy from ProfiThon.site

import {  varchar, bigint, unique, serial, doublePrecision } from "drizzle-orm/pg-core"
//import { sql } from "drizzle-orm"


export const project_logs = pgTable("project_logs", {
	project: varchar("project", { length: 255 }).primaryKey().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	visit_count: bigint("visit_count", { mode: "number" }).default(0),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	github_stars_count: bigint("github_stars_count", { mode: "number" }).default(0),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	tx_count: bigint("tx_count", { mode: "number" }).default(0),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	like_count: bigint("like_count", { mode: "number" }).default(0),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	members_count: bigint("members_count", { mode: "number" }).default(0),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	profit: bigint("profit", { mode: "number" }).default(0),
	createdAt: timestamp("createdAt", { withTimezone: true, mode: 'string' }).defaultNow(),
});

export const user = pgTable("users", {
	id: serial("id").primaryKey().notNull(),
	name: varchar("name", { length: 255 }).notNull(),
	email: varchar("email", { length: 255 }).notNull(),
	project: varchar("project", { length: 255 }).notNull(),
	image: varchar("image", { length: 255 }),
	createdAt: timestamp("createdAt", { withTimezone: true, mode: 'string' }).defaultNow(),
},
(table) => {
	return {
		users_email_key: unique("users_email_key").on(table.email),
	}
});

export const projects = pgTable("projects", {
	id: serial("id").primaryKey().notNull(),
	project: varchar("project", { length: 255 }).notNull(),
	project_link: varchar("project_link", { length: 255 }),
	code_repo_link: varchar("code_repo_link", { length: 255 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	visit_count: bigint("visit_count", { mode: "number" }).default(0),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	tx_count: bigint("tx_count", { mode: "number" }).default(0),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	members_count: bigint("members_count", { mode: "number" }).default(0),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	stars_count: bigint("stars_count", { mode: "number" }).default(0),
	earnings: doublePrecision("earnings"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	high_score: bigint("high_score", { mode: "number" }),
},
(table) => {
	return {
		project_unique: unique("project_unique").on(table.project),
	}
});