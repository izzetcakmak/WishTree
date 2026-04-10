import { create } from 'zustand';

export type Lang = 'tr' | 'en';

interface LangStore {
  lang: Lang;
  setLang: (lang: Lang) => void;
}

export const useLangStore = create<LangStore>((set) => ({
  lang: 'tr',
  setLang: (lang) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('wishtree-lang', lang);
    }
    set({ lang });
  },
}));

// Initialize from localStorage
if (typeof window !== 'undefined') {
  const saved = localStorage.getItem('wishtree-lang') as Lang | null;
  if (saved === 'en' || saved === 'tr') {
    useLangStore.getState().setLang(saved);
  }
}

const translations = {
  // Header
  'nav.home': { tr: 'Ana Sayfa', en: 'Home' },
  'nav.allWishes': { tr: 'Tüm Dilekler', en: 'All Wishes' },
  'nav.dashboard': { tr: 'Kontrol Paneli', en: 'Dashboard' },
  'nav.aiAgents': { tr: 'AI Ajanlar', en: 'AI Agents' },
  'nav.toggleTheme': { tr: 'Tema Değiştir', en: 'Toggle Theme' },
  'nav.signOut': { tr: 'Çıkış Yap', en: 'Sign Out' },
  'nav.signIn': { tr: 'Giriş Yap', en: 'Sign In' },

  // Home Hero
  'home.title': { tr: 'Dileğini', en: 'Make Your' },
  'home.titleAccent': { tr: 'Tut', en: 'Wish' },
  'home.subtitle': { tr: 'Blockchain üzerine bir dilek yaz, benzersiz bir NFT al ve yapay zekanın anlamını keşfetmesine izin ver.', en: 'Write a wish on the blockchain, receive a unique NFT, and let AI reveal its meaning.' },
  'home.wishesOnTree': { tr: 'ağaçtaki dilek', en: 'wishes on the tree' },
  'home.totalWishes': { tr: 'Toplam Dilek', en: 'Total Wishes' },
  'home.nftsMinted': { tr: 'Basılan NFT', en: 'NFTs Minted' },
  'home.testnet': { tr: 'Test Ağı', en: 'Testnet' },
  'home.recentWishes': { tr: 'Son Dilekler', en: 'Recent Wishes' },
  'home.noWishesYet': { tr: 'Henüz dilek yok. İlk dileğini tut!', en: 'No wishes yet. Be the first!' },
  'home.poweredBy': { tr: 'Arc Testnet ile desteklenmektedir', en: 'Powered by Arc Testnet' },

  // Wallet
  'wallet.connect': { tr: 'Cüzdan Bağla', en: 'Connect Wallet' },
  'wallet.connecting': { tr: 'Bağlanıyor...', en: 'Connecting...' },
  'wallet.switchNetwork': { tr: 'Arc Testnet\'e Geç', en: 'Switch to Arc Testnet' },
  'wallet.switching': { tr: 'Geçiş yapılıyor...', en: 'Switching...' },
  'wallet.notFound': { tr: 'MetaMask bulunamadı. Lütfen MetaMask yükleyin.', en: 'MetaMask not found. Please install MetaMask.' },
  'wallet.connectionFailed': { tr: 'Bağlantı başarısız', en: 'Connection failed' },

  // Wish Form
  'wishForm.getInspired': { tr: 'İlham al:', en: 'Get inspired:' },
  'wishForm.aiSuggest': { tr: 'AI Öneri', en: 'AI Suggest' },
  'wishForm.placeholder': { tr: 'Dileğinizi buraya yazın... 🌟', en: 'Write your wish here... 🌟' },
  'wishForm.connectFirst': { tr: 'Dilek tutmak için önce cüzdanınızı bağlayın...', en: 'Connect your wallet first to make a wish...' },
  'wishForm.cost': { tr: 'Maliyet', en: 'Cost' },
  'wishForm.sendWish': { tr: 'Dilek Gönder', en: 'Send Wish' },
  'wishForm.analyzing': { tr: 'Analiz ediliyor...', en: 'Analyzing...' },
  'wishForm.sending': { tr: 'Gönderiliyor...', en: 'Sending...' },
  'wishForm.confirming': { tr: 'Onaylanıyor...', en: 'Confirming...' },
  'wishForm.wishSent': { tr: 'Dilek Gönderildi!', en: 'Wish Sent!' },
  'wishForm.tryAgain': { tr: 'Tekrar Dene', en: 'Try Again' },
  'wishForm.aiAnalysis': { tr: 'AI Analizi', en: 'AI Analysis' },
  'wishForm.confidence': { tr: 'güven', en: 'confidence' },
  'wishForm.successTitle': { tr: '🎉 Dilek Gönderildi & NFT Basıldı!', en: '🎉 Wish Sent & NFT Minted!' },

  // Categories
  'cat.love': { tr: 'Aşk', en: 'Love' },
  'cat.career': { tr: 'Kariyer', en: 'Career' },
  'cat.education': { tr: 'Eğitim', en: 'Education' },
  'cat.money': { tr: 'Para', en: 'Money' },
  'cat.travel': { tr: 'Seyahat', en: 'Travel' },
  'cat.family': { tr: 'Aile', en: 'Family' },
  'cat.general': { tr: 'Genel', en: 'General' },

  // Wishes Page
  'wishes.title': { tr: 'Tüm Dilekler', en: 'All Wishes' },
  'wishes.subtitle': { tr: 'WishTree blockchain üzerindeki tüm dileklere göz atın.', en: 'Browse all wishes hanging on the WishTree blockchain.' },
  'wishes.searchPlaceholder': { tr: 'Dilek ara...', en: 'Search wishes...' },
  'wishes.noMatch': { tr: 'Aramanızla eşleşen dilek bulunamadı.', en: 'No wishes match your search.' },
  'wishes.noWishes': { tr: 'Henüz dilek yok.', en: 'No wishes yet.' },
  'wishes.analyzingAll': { tr: 'Tüm dilekler analiz ediliyor...', en: 'Analyzing all wishes...' },
  'wishes.generateSummary': { tr: 'AI Özeti Oluştur', en: 'Generate AI Summary' },
  'wishes.aiSummary': { tr: 'AI Dilek Özeti', en: 'AI Wishes Summary' },
  'wishes.totalWishes': { tr: 'Toplam Dilek', en: 'Total Wishes' },
  'wishes.overallMood': { tr: 'Genel Ruh Hali', en: 'Overall Mood' },
  'wishes.moodScore': { tr: 'Ruh Hali Puanı', en: 'Mood Score' },
  'wishes.topThemes': { tr: 'Popüler Temalar', en: 'Top Themes' },

  // Dashboard
  'dashboard.title': { tr: 'Kontrol Paneli', en: 'Dashboard' },
  'dashboard.subtitle': { tr: 'WishTree etkinliğine ve katkılarınıza genel bakış.', en: 'Overview of WishTree activity and your contributions.' },
  'dashboard.totalWishes': { tr: 'Toplam Dilek', en: 'Total Wishes' },
  'dashboard.nftsMinted': { tr: 'Basılan NFT', en: 'NFTs Minted' },
  'dashboard.myWishes': { tr: 'Dileklerim', en: 'My Wishes' },
  'dashboard.categories': { tr: 'Kategoriler', en: 'Categories' },
  'dashboard.noData': { tr: 'Henüz analiz verisi yok. Grafikler için AI analizi ile dilek gönderin.', en: 'No analysis data yet. Submit wishes with AI analysis to see charts.' },
  'dashboard.wishCategories': { tr: 'Dilek Kategorileri', en: 'Wish Categories' },
  'dashboard.sentimentDist': { tr: 'Duygu Dağılımı', en: 'Sentiment Distribution' },

  // Login
  'login.title': { tr: 'Hesabınıza giriş yapın', en: 'Sign in to your account' },
  'login.email': { tr: 'E-posta', en: 'Email' },
  'login.password': { tr: 'Şifre', en: 'Password' },
  'login.submit': { tr: 'Giriş Yap', en: 'Sign In' },
  'login.submitting': { tr: 'Giriş yapılıyor...', en: 'Signing in...' },
  'login.invalidCredentials': { tr: 'Geçersiz e-posta veya şifre', en: 'Invalid email or password' },
  'login.error': { tr: 'Bir hata oluştu', en: 'Something went wrong' },
  'login.noAccount': { tr: 'Hesabınız yok mu?', en: 'No account?' },
  'login.signUp': { tr: 'Kayıt Ol', en: 'Sign Up' },

  // Signup
  'signup.title': { tr: 'Hesabınızı oluşturun', en: 'Create your account' },
  'signup.name': { tr: 'İsim', en: 'Name' },
  'signup.email': { tr: 'E-posta', en: 'Email' },
  'signup.password': { tr: 'Şifre', en: 'Password' },
  'signup.submit': { tr: 'Hesap Oluştur', en: 'Create Account' },
  'signup.submitting': { tr: 'Oluşturuluyor...', en: 'Creating...' },
  'signup.failed': { tr: 'Kayıt başarısız', en: 'Signup failed' },
  'signup.loginFailed': { tr: 'Hesap oluşturuldu ama giriş başarısız oldu. Lütfen giriş yapmayı deneyin.', en: 'Account created but login failed. Please try logging in.' },
  'signup.error': { tr: 'Bir hata oluştu', en: 'Something went wrong' },
  'signup.hasAccount': { tr: 'Zaten hesabınız var mı?', en: 'Already have an account?' },
  'signup.signIn': { tr: 'Giriş Yap', en: 'Sign In' },

  // Agents
  'agents.title': { tr: 'AI Ajan Kaydı', en: 'AI Agents Registry' },
  'agents.subtitle': { tr: 'Arc Testnet üzerinde ERC-8004 zincir üstü AI ajan kimlikleri', en: 'ERC-8004 onchain AI agent identities on Arc Testnet' },
  'agents.register': { tr: 'Ajan Kaydet', en: 'Register Agent' },
  'agents.searchPlaceholder': { tr: 'Ajan ara...', en: 'Search agents...' },
  'agents.allTypes': { tr: 'Tüm Tipler', en: 'All Types' },
  'agents.loading': { tr: 'Ajanlar yükleniyor...', en: 'Loading agents...' },
  'agents.noFound': { tr: 'Ajan Bulunamadı', en: 'No Agents Found' },
  'agents.beFirst': { tr: 'WishTree ağında ilk AI ajanını kaydet!', en: 'Be the first to register an AI agent on the WishTree network!' },
  'agents.registerYour': { tr: 'Ajanınızı Kaydedin', en: 'Register Your Agent' },
  'agents.registered': { tr: 'Kayıtlı', en: 'Registered' },
  'agents.pending': { tr: 'Beklemede', en: 'Pending' },
  'agents.feedback': { tr: 'geri bildirim', en: 'feedback' },
  'agents.feedbacks': { tr: 'geri bildirim', en: 'feedbacks' },

  // Register Agent
  'register.title': { tr: 'AI Ajan Kaydet', en: 'Register AI Agent' },
  'register.subtitle': { tr: 'ERC-8004 kullanarak AI ajanınız için zincir üstü kimlik oluşturun', en: 'Create an onchain identity for your AI agent using ERC-8004' },
  'register.agentName': { tr: 'Ajan Adı *', en: 'Agent Name *' },
  'register.agentNamePlaceholder': { tr: 'ör. WishTree AI Analizcisi', en: 'e.g. WishTree AI Analyzer' },
  'register.description': { tr: 'Açıklama *', en: 'Description *' },
  'register.descriptionPlaceholder': { tr: 'AI ajanınız ne yapıyor?', en: 'What does your AI agent do?' },
  'register.agentType': { tr: 'Ajan Tipi', en: 'Agent Type' },
  'register.capabilities': { tr: 'Yetenekler', en: 'Capabilities' },
  'register.capabilityPlaceholder': { tr: 'Yetenek', en: 'Capability' },
  'register.addCapability': { tr: 'Yetenek ekle', en: 'Add capability' },
  'register.version': { tr: 'Versiyon', en: 'Version' },
  'register.submit': { tr: 'Arc Testnet\'de Kaydet', en: 'Register on Arc Testnet' },
  'register.gasNote': { tr: 'Kayıt, ERC-8004 IdentityRegistry üzerinden bir ERC-721 kimlik tokeni basar. Gas ~0.006 USDC-TESTNET.', en: 'Registration mints an ERC-721 identity token via the ERC-8004 IdentityRegistry. Gas is ~0.006 USDC-TESTNET on Arc.' },
  'register.waitingSignature': { tr: 'Cüzdan İmzası Bekleniyor...', en: 'Waiting for Wallet Signature...' },
  'register.confirmingTx': { tr: 'İşlem Onaylanıyor...', en: 'Confirming Transaction...' },
  'register.savingData': { tr: 'Ajan Verisi Kaydediliyor...', en: 'Saving Agent Data...' },
  'register.confirmMetaMask': { tr: 'Lütfen MetaMask\'ta işlemi onaylayın', en: 'Please confirm the transaction in MetaMask' },
  'register.waitingBlockchain': { tr: 'Blockchain onayı bekleniyor', en: 'Waiting for blockchain confirmation' },
  'register.storingDb': { tr: 'Ajan bilgileri veritabanına kaydediliyor', en: 'Storing agent information in database' },
  'register.success': { tr: 'Ajan Kaydedildi!', en: 'Agent Registered!' },
  'register.successSubtitle': { tr: 'AI ajanınız artık Arc Testnet üzerinde zincir üstü bir kimliğe sahip', en: 'Your AI agent now has an onchain identity on Arc Testnet' },
  'register.viewAgent': { tr: 'Ajanı Görüntüle', en: 'View Agent' },
  'register.allAgents': { tr: 'Tüm Ajanlar', en: 'All Agents' },
  'register.viewOnArcScan': { tr: 'ArcScan\'da Görüntüle ↗', en: 'View on ArcScan ↗' },
  'register.trackOnArcScan': { tr: 'ArcScan\'da Takip Et ↗', en: 'Track on ArcScan ↗' },
  'register.connectWallet': { tr: 'Lütfen cüzdanınızı bağlayın', en: 'Please connect your wallet' },
  'register.switchNetwork': { tr: 'Lütfen Arc Testnet\'e geçin', en: 'Please switch to Arc Testnet' },
  'register.rejected': { tr: 'İşlem kullanıcı tarafından reddedildi', en: 'Transaction rejected by user' },
  'register.failed': { tr: 'Kayıt başarısız', en: 'Registration failed' },

  // Agent Detail
  'agentDetail.overview': { tr: 'Genel Bakış', en: 'Overview' },
  'agentDetail.reputation': { tr: 'İtibar', en: 'Reputation' },
  'agentDetail.validation': { tr: 'Doğrulama', en: 'Validation' },
  'agentDetail.feedbacks': { tr: 'Geri Bildirimler', en: 'Feedbacks' },
  'agentDetail.avgScore': { tr: 'Ort. Puan', en: 'Avg Score' },
  'agentDetail.verified': { tr: 'Doğrulanmış', en: 'Verified' },
  'agentDetail.type': { tr: 'Tip', en: 'Type' },
  'agentDetail.contracts': { tr: 'ERC-8004 Kontratları', en: 'ERC-8004 Contracts' },
  'agentDetail.viewRegistration': { tr: 'ArcScan\'da kaydı görüntüle', en: 'View registration on ArcScan' },
  'agentDetail.giveFeedback': { tr: 'İtibar Geri Bildirimi Ver', en: 'Give Reputation Feedback' },
  'agentDetail.ownerCannot': { tr: 'ERC-8004\'e göre, ajan sahipleri kendi ajanlarına geri bildirim kaydedemez.', en: 'Per ERC-8004, agent owners cannot record reputation for their own agents.' },
  'agentDetail.feedbackRecorded': { tr: 'Geri bildirim zincir üstüne kaydedildi!', en: 'Feedback recorded onchain!' },
  'agentDetail.score': { tr: 'Puan', en: 'Score' },
  'agentDetail.tag': { tr: 'Etiket', en: 'Tag' },
  'agentDetail.comment': { tr: 'Yorum (isteğe bağlı)', en: 'Comment (optional)' },
  'agentDetail.commentPlaceholder': { tr: 'İsteğe bağlı yorum...', en: 'Optional comment...' },
  'agentDetail.submitFeedback': { tr: 'Geri Bildirim Gönder', en: 'Submit Feedback' },
  'agentDetail.sendingFb': { tr: 'Gönderiliyor...', en: 'Sending...' },
  'agentDetail.feedbackHistory': { tr: 'Geri Bildirim Geçmişi', en: 'Feedback History' },
  'agentDetail.validationTitle': { tr: 'Doğrulama Talebi', en: 'Request Validation' },
  'agentDetail.validationHowTitle': { tr: 'Doğrulama Nasıl Çalışır?', en: 'How Does Validation Work?' },
  'agentDetail.validationHow1': { tr: 'Agent sahibi olarak, güvendiğiniz bir doğrulayıcıya (validator) doğrulama talebi gönderirsiniz.', en: 'As the agent owner, you send a validation request to a trusted validator.' },
  'agentDetail.validationHow2': { tr: 'Doğrulayıcı, herhangi bir Ethereum cüzdan adresine sahip kişi olabilir — örneğin bir arkadaşınız, bir topluluk üyesi veya kendiniz.', en: 'The validator can be anyone with an Ethereum wallet address — a friend, a community member, or yourself.' },
  'agentDetail.validationHow3': { tr: 'Doğrulayıcı daha sonra zincir üzerinde (onchain) yanıt vererek agent\'ınızı onaylar veya reddeder.', en: 'The validator then responds onchain to approve or reject your agent.' },
  'agentDetail.validationSent': { tr: 'Doğrulama talebi gönderildi!', en: 'Validation request sent!' },
  'agentDetail.validatorAddress': { tr: 'Doğrulayıcı Adresi', en: 'Validator Address' },
  'agentDetail.validatorHelp': { tr: 'Doğrulamayı yapmasını istediğiniz kişinin Ethereum cüzdan adresi (0x ile başlayan).', en: 'The Ethereum wallet address (starting with 0x) of the person you want to validate.' },
  'agentDetail.useMyWallet': { tr: '🔗 Kendi cüzdan adresimi kullan (self-validation)', en: '🔗 Use my wallet address (self-validation)' },
  'agentDetail.requestValidation': { tr: 'Doğrulama Talep Et', en: 'Request Validation' },
  'agentDetail.requestingSending': { tr: 'Gönderiliyor...', en: 'Sending...' },
  'agentDetail.validationHistory': { tr: 'Doğrulama Geçmişi', en: 'Validation History' },
  'agentDetail.passed': { tr: 'Geçti', en: 'Passed' },
  'agentDetail.failedStatus': { tr: 'Başarısız', en: 'Failed' },
  'agentDetail.pendingStatus': { tr: 'Beklemede', en: 'Pending' },
  'agentDetail.response': { tr: 'Yanıt', en: 'Response' },
  'agentDetail.notFound': { tr: 'Ajan bulunamadı', en: 'Agent not found' },
  'agentDetail.registered': { tr: 'Kayıtlı', en: 'Registered' },
  'agentDetail.pending': { tr: 'Beklemede', en: 'Pending' },
  'agentDetail.feedback': { tr: 'geri bildirim', en: 'feedback' },
  'agentDetail.feedbackPlural': { tr: 'geri bildirim', en: 'feedbacks' },
  'agentDetail.poor': { tr: 'Kötü', en: 'Poor' },
  'agentDetail.excellent': { tr: 'Mükemmel', en: 'Excellent' },
  'agentDetail.noTokenId': { tr: 'Ajanın zincir üstü token ID\'si yok', en: 'Agent has no onchain token ID' },
  'agentDetail.ownerCannotFb': { tr: 'Sahip kendi ajanına geri bildirim veremez (ERC-8004 kuralı)', en: 'Owner cannot give feedback to their own agent (ERC-8004 rule)' },
  'agentDetail.txRejected': { tr: 'İşlem reddedildi', en: 'Transaction rejected' },
  'agentDetail.feedbackFailed': { tr: 'Geri bildirim başarısız oldu', en: 'Feedback failed' },
  'agentDetail.enterValidator': { tr: 'Doğrulayıcı adresini girin', en: 'Enter validator address' },
  'agentDetail.validationFailed': { tr: 'Doğrulama talebi başarısız oldu', en: 'Validation request failed' },
  'agentDetail.connectWallet': { tr: 'Lütfen cüzdanınızı bağlayın', en: 'Please connect wallet' },
  'agentDetail.switchNetwork': { tr: 'Lütfen Arc Testnet\'e geçin', en: 'Please switch to Arc Testnet' },

  // Feedback tags
  'tag.good_performance': { tr: 'İyi Performans', en: 'Good Performance' },
  'tag.successful_trade': { tr: 'Başarılı İşlem', en: 'Successful Trade' },
  'tag.accurate_analysis': { tr: 'Doğru Analiz', en: 'Accurate Analysis' },
  'tag.helpful_suggestion': { tr: 'Faydalı Öneri', en: 'Helpful Suggestion' },
  'tag.fast_execution': { tr: 'Hızlı Çalışma', en: 'Fast Execution' },
  'tag.poor_result': { tr: 'Kötü Sonuç', en: 'Poor Result' },
  'tag.other': { tr: 'Diğer', en: 'Other' },

  // Error Boundary
  'error.title': { tr: 'Bir Hata Oluştu', en: 'An Error Occurred' },
  'error.message': { tr: 'İşlem sırasında bir sorun yaşandı. Lütfen tekrar deneyin.', en: 'Something went wrong. Please try again.' },
  'error.retry': { tr: 'Tekrar Dene', en: 'Try Again' },

  // Sentiments
  'sentiment.positive': { tr: 'pozitif', en: 'positive' },
  'sentiment.negative': { tr: 'negatif', en: 'negative' },
  'sentiment.neutral': { tr: 'nötr', en: 'neutral' },

  // Score labels
  'score.poor': { tr: 'Kötü', en: 'Poor' },
  'score.excellent': { tr: 'Mükemmel', en: 'Excellent' },

  // Wish Finance
  'nav.finance': { tr: 'Wish Finance', en: 'Wish Finance' },
  'finance.title': { tr: 'Wish Finance', en: 'Wish Finance' },
  'finance.subtitle': { tr: 'Circle App Kits ile USDC gönder, köprüle ve takas et', en: 'Send, bridge and swap USDC with Circle App Kits' },
  'finance.poweredBy': { tr: 'Circle CCTP V2 & App Kits ile güçlendirilmiştir', en: 'Powered by Circle CCTP V2 & App Kits' },

  // Swap
  'finance.swap': { tr: 'Takas', en: 'Swap' },
  'finance.swapDesc': { tr: 'Arc Testnet üzerinde token takası yapın', en: 'Swap tokens on Arc Testnet' },
  'finance.fromToken': { tr: 'Token\'dan', en: 'From Token' },
  'finance.toToken': { tr: 'Token\'a', en: 'To Token' },
  'finance.amount': { tr: 'Miktar', en: 'Amount' },
  'finance.swapBtn': { tr: 'Takas Et', en: 'Swap' },
  'finance.swapping': { tr: 'Takas yapılıyor...', en: 'Swapping...' },

  // Bridge
  'finance.bridge': { tr: 'Köprü', en: 'Bridge' },
  'finance.bridgeDesc': { tr: 'USDC\'yi zincirler arası köprüleyin', en: 'Bridge USDC across chains' },
  'finance.fromChain': { tr: 'Kaynak Zincir', en: 'From Chain' },
  'finance.toChain': { tr: 'Hedef Zincir', en: 'To Chain' },
  'finance.bridgeBtn': { tr: 'Köprüle', en: 'Bridge' },
  'finance.bridging': { tr: 'Köprüleniyor...', en: 'Bridging...' },
  'finance.bridgeAmount': { tr: 'USDC Miktarı', en: 'USDC Amount' },

  // Send
  'finance.send': { tr: 'Gönder', en: 'Send' },
  'finance.sendDesc': { tr: 'Arc Testnet üzerinde USDC gönderin', en: 'Send USDC on Arc Testnet' },
  'finance.recipient': { tr: 'Alıcı Adresi', en: 'Recipient Address' },
  'finance.sendBtn': { tr: 'Gönder', en: 'Send' },
  'finance.sending': { tr: 'Gönderiliyor...', en: 'Sending...' },
  'finance.sendAmount': { tr: 'USDC Miktarı', en: 'USDC Amount' },

  // Finance shared
  'finance.connectFirst': { tr: 'Önce cüzdanınızı bağlayın', en: 'Connect your wallet first' },
  'finance.success': { tr: 'İşlem başarılı!', en: 'Transaction successful!' },
  'finance.error': { tr: 'İşlem başarısız oldu', en: 'Transaction failed' },
  'finance.txRejected': { tr: 'İşlem reddedildi', en: 'Transaction rejected' },
  'finance.viewTx': { tr: 'İşlemi görüntüle', en: 'View transaction' },
  'finance.estimating': { tr: 'Tahmini ücret hesaplanıyor...', en: 'Estimating fees...' },
  'finance.estimatedFee': { tr: 'Tahmini Ücret', en: 'Estimated Fee' },
  'finance.noWallet': { tr: 'MetaMask bulunamadı', en: 'MetaMask not found' },
  'finance.step': { tr: 'Adım', en: 'Step' },
  'finance.processing': { tr: 'İşleniyor...', en: 'Processing...' },
} as const;

type TranslationKey = keyof typeof translations;

export function t(key: TranslationKey, lang?: Lang): string {
  const currentLang = lang || useLangStore.getState().lang;
  const entry = translations[key];
  if (!entry) return key;
  return entry[currentLang] || entry['en'] || key;
}

export function useT() {
  const lang = useLangStore((s) => s.lang);
  return (key: TranslationKey) => {
    const entry = translations[key];
    if (!entry) return key;
    return entry[lang] || entry['en'] || key;
  };
}
