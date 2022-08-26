import type { GetServerSideProps } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import { sanityClient, urlFor } from '../sanity'
import { Collection } from '../typings'

interface Props {
  collections: Collection[]
}

const Home = ({ collections }: Props) => {
  return (
    <div className="mx-auto max-w-7xl flex flex-col pt-20 px-10 2xl:px-0 bg-gradient-to-t from-pink-300 via-purple-300 to-indigo-400">

      <Head>
        <title>NFT drop</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <h1 className='w-52 text-xl cursor-pointer font-extralight sm:w-80'>The {' '}<span className='font-extrabold underline decoration-pink-600/50'>Action movies</span>{' '}NFT market</h1>

      <main className='bg-slate-100 rounded-xl mt-10'>
        <div className='grid space-x-3 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4'>
          {collections.map(collection => (
            <Link key={collection._id} href={`nft/${collection.slug.current}`}>
              <div className='flex flex-col items-center cursor-pointer transition-all duration-200 hover:scale-95 p-4'>
                <img src={urlFor(collection.previewImage).url()} className='h-96 w-60 rounded-2xl object-cover' />
                <div className='pt-2 text-center'>
                  <h2 className='text-3xl font-semibold'>{collection.title}</h2>
                  <p className='mt-2 text-sm text-gray-400'>{collection.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>

      <footer className='mt-10 flex items-center justify-center font-bold text-sm h-12 text-slate-700'>
        <Link href='https://twitter.com/crater90'>
          <a>made by crater90 ❤️</a>
        </Link>
      </footer>

    </div>
  )
}

export default Home

export const getServerSideProps: GetServerSideProps = async () => {
  const query = `*[_type == "collection"] {
    _id,
    title,
    address,
    description,
    nftCollectionName,
    mainImage {
      asset
    },
    previewImage {
      asset
    },
    slug {
      current
    },
    creator-> {
      _id,
      name,
      address,
      slug {
        current
      },
    },
  }`

  const collections = await sanityClient.fetch(query)

  return {
    props: {
      collections
    }
  }
}
