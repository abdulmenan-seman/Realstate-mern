import { useSelector } from 'react-redux'

export default function Profile() {
  const {currentUser} = useSelector(state => state.user);
  return (
    <div className='p-3 max-w-lg mx-auto'>
      <h1 className='text-3xl font-semibold text-center my-7'>Profile</h1>
      <form className='flex flex-col gap-4'>
  <p className='text-lg text-slate-700 text-center'> welcome, {currentUser.username}!</p>
  <input type="text" placeholder='Username' id='username' className='border p-3 rounded-lg' />
  <input type="email" placeholder='Email' id='email' className='border p-3 rounded-lg' />
  <input type="password" placeholder='Password' id='password' className='border p-3 rounded-lg' />
  <button type='submit' className='bg-slate-700 text-white p-3 rounded-lg uppercase hover:opacity-95 disabled:opacity-80'>Update Profile</button>
      </form>
      <div className='flex justify-between mt-5'>
        <span className='text-red-500 hover:underline cursor-pointer'>Delete Account</span>
        <span className='text-red-500 hover:underline cursor-pointer'>Sign Out</span>
      </div>
    </div>
  )
}
