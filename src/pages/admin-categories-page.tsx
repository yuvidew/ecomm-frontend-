import { SiteHeader } from '@/components/site-header'
import { CategoriesTable } from '@/features/categories/_components/categories-table'
import { CreateCategoryDialog } from '@/features/categories/_components/create-category-dialog'

/**
 * AdminCategoriesPage — /admin/categories: category list plus the
 * "New category" dialog.
 */
const AdminCategoriesPage = () => {
  return (
    <>
      <SiteHeader title="Categories" actions={<CreateCategoryDialog />} />
      <main className="p-4 lg:p-6">
        <CategoriesTable />
      </main>
    </>
  )
}

export default AdminCategoriesPage
