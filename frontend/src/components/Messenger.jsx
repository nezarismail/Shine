import React, { useState, useEffect, useRef } from "react";

const MessengerDashboard = () => {

const currentUser = JSON.parse(localStorage.getItem("user")) || { id:"me", username:"Me" };
const token = localStorage.getItem("token");

const headers = {
Authorization:`Bearer ${token}`,
"Content-Type":"application/json"
};

const [conversations,setConversations]=useState([]);
const [activeChat,setActiveChat]=useState(null);
const [messages,setMessages]=useState([]);
const [searchResults,setSearchResults]=useState([]);
const [searchQuery,setSearchQuery]=useState("");
const [inputMessage,setInputMessage]=useState("");

const messagesEndRef=useRef(null);

useEffect(()=>{fetchInbox()},[])
useEffect(()=>{scrollToBottom()},[messages])

const fetchInbox=async()=>{
try{
const res=await fetch("/api/messenger/inbox",{headers})
if(res.ok)setConversations(await res.json())
}catch(e){console.log(e)}
}

const handleSearch=async(q)=>{
setSearchQuery(q)
if(q.length<2)return setSearchResults([])

try{
const res=await fetch(`/api/messenger/search?q=${q}`,{headers})
if(res.ok)setSearchResults(await res.json())
}catch(e){console.log(e)}
}

const loadMessages=async(chatId)=>{
try{
const res=await fetch(`/api/messenger/messages/${chatId}`,{headers})
if(res.ok)setMessages(await res.json())
}catch(e){console.log(e)}
}

const selectChat=(chat)=>{
setActiveChat(chat)
setSearchQuery("")
setSearchResults([])
loadMessages(chat.id)
}

const onSend=async()=>{
if(!inputMessage.trim()||!activeChat)return

try{
const res=await fetch("/api/messenger/send",{
method:"POST",
headers,
body:JSON.stringify({
conversationId:activeChat.id,
text:inputMessage
})
})

if(res.ok){
const newMessage=await res.json()
setMessages(prev=>[...prev,newMessage])
setInputMessage("")
fetchInbox()
}

}catch(e){

const mockMsg={
id:Date.now(),
text:inputMessage,
senderId:currentUser.id
}

setMessages(prev=>[...prev,mockMsg])
setInputMessage("")
}
}

const getOtherUser=(chat)=>{
return chat.members?.find(m=>m.userId!==currentUser.id)?.user||{username:"User"}
}

const scrollToBottom=()=>{
messagesEndRef.current?.scrollIntoView({behavior:"smooth"})
}

return(

<div className="h-[calc(100vh-63px)] mt-[63px] flex bg-gray-100 overflow-hidden font-sans">

{/* LEFT NAV */}

<aside className="w-[70px] bg-gradient-to-b from-indigo-700 to-indigo-800 text-white flex flex-col items-center py-6 gap-8 shadow-lg">

<div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center font-bold text-lg">
M
</div>

<button className="w-11 h-11 rounded-xl bg-white/20 hover:bg-white/30 transition flex items-center justify-center text-xl">
💬
</button>

<button className="w-11 h-11 rounded-xl hover:bg-white/20 transition flex items-center justify-center text-xl">
👥
</button>

<button className="w-11 h-11 rounded-xl hover:bg-white/20 transition flex items-center justify-center text-xl">
⚙️
</button>

</aside>

{/* CONVERSATIONS */}

<section className="w-[320px] bg-white border-r flex flex-col">

<div className="p-5 border-b">

<h2 className="text-xl font-semibold mb-4">Messages</h2>

<input
type="text"
value={searchQuery}
onChange={(e)=>handleSearch(e.target.value)}
placeholder="Search users..."
className="w-full px-4 py-2 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
/>

</div>

<div className="flex-1 overflow-y-auto">

{conversations.map(chat=>{

const otherUser=getOtherUser(chat)

return(

<div
key={chat.id}
onClick={()=>selectChat(chat)}
className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition
${activeChat?.id===chat.id
?"bg-indigo-50 border-r-4 border-indigo-600"
:"hover:bg-gray-50"
}`}
>

<div className="w-11 h-11 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-semibold">
{otherUser.username[0]}
</div>

<div className="flex-1 min-w-0">

<div className="flex justify-between text-sm">

<span className="font-semibold truncate">
{otherUser.username}
</span>

<span className="text-gray-400 text-xs">
now
</span>

</div>

<p className="text-sm text-gray-500 truncate">
{chat.lastMessage||"No messages yet"}
</p>

</div>

</div>

)

})}

</div>

</section>

{/* CHAT */}

<main className="flex-1 flex flex-col bg-[#f6f7fb]">

{activeChat?(

<>

{/* HEADER */}

<header className="h-[70px] bg-white border-b flex items-center px-6 shadow-sm">

<div className="flex items-center gap-3">

<div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center font-semibold text-indigo-700">
{getOtherUser(activeChat).username[0]}
</div>

<div>

<h3 className="font-semibold">
{getOtherUser(activeChat).username}
</h3>

<span className="text-xs text-green-500">
Online
</span>

</div>

</div>

</header>

{/* MESSAGES */}

<div className="flex-1 overflow-y-auto px-8 py-6 space-y-5">

{messages.map(msg=>{

const isMe=msg.senderId===currentUser.id

return(

<div
key={msg.id}
className={`flex ${isMe?"justify-end":"justify-start"}`}
>

<div
className={`px-4 py-2 rounded-2xl max-w-[60%] shadow-sm
${isMe
?"bg-indigo-600 text-white rounded-tr-none"
:"bg-white border rounded-tl-none"
}
`}
>

{msg.text}

</div>

</div>

)

})}

<div ref={messagesEndRef}/>

</div>

{/* INPUT */}

<footer className="bg-white border-t p-4">

<div className="flex gap-3 max-w-4xl mx-auto">

<input
value={inputMessage}
onChange={(e)=>setInputMessage(e.target.value)}
onKeyDown={(e)=>e.key==="Enter"&&onSend()}
placeholder="Write a message..."
className="flex-1 px-4 py-3 rounded-xl bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
/>

<button
onClick={onSend}
className="px-5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition"
>
Send
</button>

</div>

</footer>

</>

):

(

<div className="flex-1 flex flex-col items-center justify-center text-gray-400">

<div className="text-5xl mb-4">
💬
</div>

<p>Select a conversation</p>

</div>

)}

</main>

</div>

)

}

export default MessengerDashboard