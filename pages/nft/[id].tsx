import React, { useEffect, useState } from 'react'
import { useAddress, useDisconnect, useMetamask, useNFTDrop } from "@thirdweb-dev/react";
import { GetServerSideProps } from 'next';
import { sanityClient, urlFor } from '../../sanity';
import { Collection } from '../../typings';
import { BigNumber } from 'ethers';
import toast, { Toaster } from 'react-hot-toast'
import Link from 'next/link';


interface Props {
  collection: Collection
}

function NftDropPage({ collection }: Props) {

  //states to store the data from thirdweb nft drop
  const [claimedSupply, setClaimedSupply] = useState<number>(0)
  const [totalSupply, setTotalSupply] = useState<BigNumber>()
  const [priceInEth, setPriceInEth] = useState<string>()
  const [loading, setLoading] = useState<Boolean>(true)
  const nftDrop = useNFTDrop(collection.address)

  //connecting wallet 
  const connectMetamask = useMetamask()
  const address = useAddress()
  const disconnect = useDisconnect()

  //fetching the price of Nft
  useEffect(() => {
    const fetchPrice = async () => {
      const claimConditions = await nftDrop?.claimConditions.getAll()
      setPriceInEth(claimConditions?.[0].currencyMetadata.displayValue)
    }
    fetchPrice()
  }, [])

  // fetching the total supply and claimed supply in the nft drop
  useEffect(() => {
    if (!nftDrop) return;

    const fetchNftDropData = async () => {
      setLoading(true)
      const claimed = await nftDrop.getAllClaimed()
      const total = await nftDrop.totalSupply()
      setClaimedSupply(claimed.length)
      setTotalSupply(total)
      setLoading(false)
    }
    fetchNftDropData()
  }, [nftDrop])

  // minting the Nft
  const mintNft = () => {
    if (!nftDrop || !address) return

    const quantity = 1
    setLoading(true)
    const notification = toast.loading('Minting....', {
      style: {
        background: 'white',
        color: 'green',
        fontWeight: 'bolder',
        fontSize: '17px',
        padding: '20px',
      }
    })
    nftDrop.claimTo(address, quantity).then(async (tsx) => {
      toast('You successfully minted the NFT', {
        style: {
          background: 'green',
          color: 'white',
          fontWeight: 'bolder',
          fontSize: '17px',
          padding: '20px',
        }
      })

    }).catch((err) => {
      console.log(err)
      toast('Something went wrong....', {
        style: {
          background: 'red',
          color: 'white',
          fontWeight: 'bolder',
          fontSize: '17px',
          padding: '20px',
        }
      })
    }).finally(() => {
      setLoading(false)
      toast.dismiss(notification)
    })
  }

  return (
    <div className='flex h-screen flex-col lg:grid lg:grid-cols-10'>
      <Toaster position='bottom-center' />

      <div className='bg-gradient-to-br from-cyan-800 to-rose-500 lg:col-span-4'>
        <div className='flex flex-col items-center justify-center py-2 lg:min-h-screen'>
          <div className='rounded-xl bg-gradient-to-br from-yellow-400 to-purple-500 p-2'>
            <img src={urlFor(collection.previewImage).url()} className='w-44 rounded-xl object-cover lg:h-96 lg:w-72' />
          </div>
          <div className='space-y-2 p-5 text-center'>
            <h1 className='text-4xl font-bold text-white'>{collection.nftCollectionName}</h1>
            <h1 className='text-xl text-gray-300'>{collection.description}</h1>
          </div>
        </div>
      </div>

      <div className='flex flex-1 p-12 flex-col lg:col-span-6'>
        <header className='flex items-center justify-between'>
          <Link href={'/'}>
            <h1 className='w-52 text-xl cursor-pointer font-extralight sm:w-80'>The {' '}<span className='font-extrabold underline decoration-pink-600/50'>Action movies</span>{' '}NFT market</h1>
          </Link>
          <button onClick={() => (address ? disconnect() : connectMetamask())} className='bg-rose-400 rounded-lg px-4 py-2 text-white font-bold text-xs lg:text-base'>
            {address ? `Sign Out` : `Sign In`}
          </button>
        </header>
        <hr className='my-2 text-slate-300' />

        {address && (
          <p className='text-center text-green-500'>You are logged in with wallet {address.substring(0, 5)}...{address.substring(address.length - 5)}</p>
        )}

        <div className='mt-10 flex flex-1 flex-col items-center space-y-6 text-center lg:space-y-0 lg:justify-between'>
          <img src={urlFor(collection.mainImage).url()} className='w-80 object-cover pb-10 lg:h-40' />
          <h1 className='text-3xl font-bold lg:text-5xl lg:font-extrabold'>{collection.title}</h1>

          {loading ?
            <p className='pt-2 text-xl text-green-500 animate-pulse'>Loading supply count....</p> :
            <p className='pt-2 pb-2 text-xl text-green-500'>{`${claimedSupply} / ${totalSupply?.toString()} NFTs claimed`}</p>
          }

          <button onClick={mintNft} disabled={loading || claimedSupply === 4 || !address} className='mt-10 h-12 w-full rounded-xl bg-red-600 text-white disabled:bg-gray-400'>

            {loading ? (
              <>Loading</>
            ) : claimedSupply === 4 ? (
              <>Sold Out</>
            ) : !address ? (
              <>Sign in to Mint</>
            ) : (
              <span>Mint now ({priceInEth} Eth)</span>
            )}

          </button>
        </div>
      </div>
    </div>
  )
}

export default NftDropPage

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const query = `*[_type == "collection" && slug.current == $id][0] {
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

  const collection = await sanityClient.fetch(query, {
    id: params?.id
  })

  if (!collection) {
    return {
      notFound: true
    }
  }

  return {
    props: {
      collection
    }
  }
}