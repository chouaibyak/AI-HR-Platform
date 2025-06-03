import React, { useState, useEffect } from 'react';
import { Search, Send, Paperclip, MoreVertical, User, Briefcase } from 'lucide-react';
import { auth, db } from '../firebase';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';

const InboxRecruiter = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setError("Veuillez vous connecter");
      setLoading(false);
      return;
    }

    // Écouter les conversations
    const conversationsQuery = query(
      collection(db, 'conversations'),
      where('recruiter_id', '==', currentUser.uid),
      orderBy('last_message_at', 'desc')
    );

    const unsubscribeConversations = onSnapshot(conversationsQuery, (snapshot) => {
      const conversationsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setConversations(conversationsData);
      setLoading(false);
    }, (error) => {
      console.error("Erreur lors du chargement des conversations:", error);
      setError("Erreur lors du chargement des conversations");
      setLoading(false);
    });

    return () => {
      unsubscribeConversations();
    };
  }, []);

  useEffect(() => {
    if (!selectedConversation) return;

    // Écouter les messages de la conversation sélectionnée
    const messagesQuery = query(
      collection(db, 'messages'),
      where('conversation_id', '==', selectedConversation.id),
      orderBy('created_at', 'asc')
    );

    const unsubscribeMessages = onSnapshot(messagesQuery, (snapshot) => {
      const messagesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(messagesData);
    });

    return () => {
      unsubscribeMessages();
    };
  }, [selectedConversation]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      const currentUser = auth.currentUser;
      await addDoc(collection(db, 'messages'), {
        conversation_id: selectedConversation.id,
        sender_id: currentUser.uid,
        content: newMessage.trim(),
        created_at: serverTimestamp(),
        is_read: false
      });

      // Mettre à jour la dernière activité de la conversation
      await addDoc(collection(db, 'conversations'), {
        ...selectedConversation,
        last_message_at: serverTimestamp(),
        last_message: newMessage.trim()
      });

      setNewMessage('');
    } catch (error) {
      console.error("Erreur lors de l'envoi du message:", error);
      setError("Erreur lors de l'envoi du message");
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.candidate_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.job_title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-20 ml-8 mr-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
          <h3 className="text-lg font-medium text-red-800 mb-2">Erreur</h3>
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-20 ml-8 mr-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
        <p className="text-gray-600 mt-2">
          Gérez vos conversations avec les candidats
        </p>
      </div>

      <div className="grid grid-cols-12 gap-6 h-[calc(100vh-12rem)]">
        {/* Liste des conversations */}
        <div className="col-span-4 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Rechercher une conversation..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="overflow-y-auto h-[calc(100%-4rem)]">
            {filteredConversations.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <MessageSquare size={48} className="mx-auto mb-4" />
                <p className="text-lg">Aucune conversation</p>
                <p className="text-sm text-gray-400 mt-2">
                  Vos conversations avec les candidats apparaîtront ici
                </p>
              </div>
            ) : (
              filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors duration-200 ${selectedConversation?.id === conversation.id ? 'bg-blue-50' : ''
                    }`}
                  onClick={() => setSelectedConversation(conversation)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="bg-blue-100 p-2 rounded-full">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{conversation.candidate_name}</h3>
                        <p className="text-sm text-gray-500">{conversation.job_title}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">
                        {conversation.last_message_at?.toDate().toLocaleDateString()}
                      </p>
                      {!conversation.is_read && (
                        <span className="inline-block w-2 h-2 bg-blue-600 rounded-full mt-1"></span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Zone de conversation */}
        <div className="col-span-8 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col">
          {selectedConversation ? (
            <>
              {/* En-tête de la conversation */}
              <div className="p-4 border-b flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{selectedConversation.candidate_name}</h3>
                    <p className="text-sm text-gray-500">{selectedConversation.job_title}</p>
                  </div>
                </div>
                <button className="text-gray-400 hover:text-gray-600">
                  <MoreVertical size={20} />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender_id === auth.currentUser?.uid ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${message.sender_id === auth.currentUser?.uid
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                        }`}
                    >
                      <p>{message.content}</p>
                      <p className="text-xs mt-1 opacity-70">
                        {message.created_at?.toDate().toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Zone de saisie */}
              <form onSubmit={handleSendMessage} className="p-4 border-t">
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <Paperclip size={20} />
                  </button>
                  <input
                    type="text"
                    placeholder="Écrivez votre message..."
                    className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                  />
                  <button
                    type="submit"
                    className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700"
                  >
                    <Send size={20} />
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <MessageSquare size={48} className="mx-auto mb-4" />
                <p className="text-lg">Sélectionnez une conversation</p>
                <p className="text-sm text-gray-400 mt-2">
                  Choisissez une conversation pour commencer à discuter
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InboxRecruiter;
