/** Category — a row from the backend `categories` table. */
export type Category = {
  id: number
  name: string
  slug: string
  image: string
  created_at: string
}

/** ListCategoriesResponse — body returned by GET /api/categories. */
export type ListCategoriesResponse = {
  categories: Category[]
}

/** CreateCategoryInput — body sent to POST /api/categories. */
export type CreateCategoryInput = {
  name: string
}

/** CreateCategoryResponse — body returned by POST /api/categories. */
export type CreateCategoryResponse = Pick<Category, 'id' | 'name' | 'slug' | 'image'>
