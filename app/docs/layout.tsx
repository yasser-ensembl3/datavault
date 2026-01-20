import { Footer, Layout, Navbar } from 'nextra-theme-docs'
import { getPageMap } from 'nextra/page-map'
import 'nextra-theme-docs/style.css'

export const metadata = {
  title: 'DataVault Documentation',
  description: 'Documentation for DataVault research management',
}

export default async function DocsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pageMap = await getPageMap('/docs')

  return (
    <Layout
      navbar={
        <Navbar
          logo={<span className="font-bold">DataVault Docs</span>}
          logoLink="/vault"
        />
      }
      pageMap={pageMap}
      docsRepositoryBase="https://github.com/yourusername/datavault"
      footer={<Footer>MIT {new Date().getFullYear()} DataVault</Footer>}
    >
      {children}
    </Layout>
  )
}
