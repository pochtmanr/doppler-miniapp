const translations: Record<string, Record<string, string>> = {
  en: {
    title: 'Doppler VPN Pro',
    subtitle: 'Unlimited speed, all servers, no ads',
    monthly: 'Monthly',
    sixMonth: '6 Months',
    yearly: 'Yearly',
    bestValue: 'Best Value',
    save: 'Save',
    subscribe: 'Subscribe',
    perMonth: '/mo',
    features: 'What you get',
    feat1: 'All server locations',
    feat2: 'Unlimited bandwidth',
    feat3: 'No ads',
    feat4: 'Priority support',
    feat5: 'Up to 5 devices',
    processing: 'Processing...',
    success_title: 'Payment Successful! 🎉',
    success_desc: 'Your Doppler VPN Pro subscription is now active.',
    success_close: 'Close',
    error: 'Something went wrong',
  },
  ru: {
    title: 'Doppler VPN Pro',
    subtitle: 'Безлимитная скорость, все серверы, без рекламы',
    monthly: 'Месяц',
    sixMonth: '6 месяцев',
    yearly: 'Год',
    bestValue: 'Лучшее предложение',
    save: 'Экономия',
    subscribe: 'Подписаться',
    perMonth: '/мес',
    features: 'Что вы получите',
    feat1: 'Все серверы',
    feat2: 'Безлимитный трафик',
    feat3: 'Без рекламы',
    feat4: 'Приоритетная поддержка',
    feat5: 'До 5 устройств',
    processing: 'Обработка...',
    success_title: 'Оплата прошла успешно! 🎉',
    success_desc: 'Ваша подписка Doppler VPN Pro активирована.',
    success_close: 'Закрыть',
    error: 'Произошла ошибка',
  },
  es: { title: 'Doppler VPN Pro', subtitle: 'Velocidad ilimitada, todos los servidores, sin anuncios', monthly: 'Mensual', sixMonth: '6 Meses', yearly: 'Anual', bestValue: 'Mejor oferta', save: 'Ahorra', subscribe: 'Suscribirse', perMonth: '/mes', features: 'Qué obtienes', feat1: 'Todas las ubicaciones', feat2: 'Ancho de banda ilimitado', feat3: 'Sin anuncios', feat4: 'Soporte prioritario', feat5: 'Hasta 5 dispositivos', processing: 'Procesando...', success_title: '¡Pago exitoso! 🎉', success_desc: 'Tu suscripción Doppler VPN Pro está activa.', success_close: 'Cerrar', error: 'Algo salió mal' },
  zh: { title: 'Doppler VPN Pro', subtitle: '无限速度，所有服务器，无广告', monthly: '月付', sixMonth: '6个月', yearly: '年付', bestValue: '最佳优惠', save: '节省', subscribe: '订阅', perMonth: '/月', features: '您将获得', feat1: '所有服务器', feat2: '无限带宽', feat3: '无广告', feat4: '优先支持', feat5: '最多5台设备', processing: '处理中...', success_title: '支付成功！🎉', success_desc: '您的Doppler VPN Pro订阅已激活。', success_close: '关闭', error: '出了点问题' },
  hi: { title: 'Doppler VPN Pro', subtitle: 'अनलिमिटेड स्पीड, सभी सर्वर, कोई विज्ञापन नहीं', monthly: 'मासिक', sixMonth: '6 महीने', yearly: 'वार्षिक', bestValue: 'सर्वोत्तम', save: 'बचत', subscribe: 'सदस्यता लें', perMonth: '/माह', features: 'आपको क्या मिलेगा', feat1: 'सभी सर्वर', feat2: 'अनलिमिटेड बैंडविड्थ', feat3: 'कोई विज्ञापन नहीं', feat4: 'प्राथमिकता सहायता', feat5: '5 डिवाइस तक', processing: 'प्रोसेसिंग...', success_title: 'भुगतान सफल! 🎉', success_desc: 'आपकी सदस्यता सक्रिय है।', success_close: 'बंद करें', error: 'कुछ गलत हो गया' },
  ar: { title: 'Doppler VPN Pro', subtitle: 'سرعة غير محدودة، جميع الخوادم، بدون إعلانات', monthly: 'شهري', sixMonth: '6 أشهر', yearly: 'سنوي', bestValue: 'أفضل عرض', save: 'وفر', subscribe: 'اشترك', perMonth: '/شهر', features: 'ماذا تحصل', feat1: 'جميع المواقع', feat2: 'نطاق ترددي غير محدود', feat3: 'بدون إعلانات', feat4: 'دعم أولوي', feat5: 'حتى 5 أجهزة', processing: '...جارٍ المعالجة', success_title: '!تم الدفع بنجاح 🎉', success_desc: '.اشتراكك نشط الآن', success_close: 'إغلاق', error: 'حدث خطأ ما' },
  pt: { title: 'Doppler VPN Pro', subtitle: 'Velocidade ilimitada, todos os servidores, sem anúncios', monthly: 'Mensal', sixMonth: '6 Meses', yearly: 'Anual', bestValue: 'Melhor oferta', save: 'Economize', subscribe: 'Assinar', perMonth: '/mês', features: 'O que você ganha', feat1: 'Todos os servidores', feat2: 'Largura de banda ilimitada', feat3: 'Sem anúncios', feat4: 'Suporte prioritário', feat5: 'Até 5 dispositivos', processing: 'Processando...', success_title: 'Pagamento realizado! 🎉', success_desc: 'Sua assinatura está ativa.', success_close: 'Fechar', error: 'Algo deu errado' },
  ja: { title: 'Doppler VPN Pro', subtitle: '無制限速度、全サーバー、広告なし', monthly: '月額', sixMonth: '6ヶ月', yearly: '年額', bestValue: 'お得', save: '節約', subscribe: '登録', perMonth: '/月', features: '特典', feat1: '全サーバー', feat2: '無制限帯域', feat3: '広告なし', feat4: '優先サポート', feat5: '最大5台', processing: '処理中...', success_title: '支払い完了！🎉', success_desc: 'サブスクリプションが有効になりました。', success_close: '閉じる', error: 'エラーが発生しました' },
  de: { title: 'Doppler VPN Pro', subtitle: 'Unbegrenzte Geschwindigkeit, alle Server, keine Werbung', monthly: 'Monatlich', sixMonth: '6 Monate', yearly: 'Jährlich', bestValue: 'Bestes Angebot', save: 'Spare', subscribe: 'Abonnieren', perMonth: '/Monat', features: 'Was Sie bekommen', feat1: 'Alle Standorte', feat2: 'Unbegrenzte Bandbreite', feat3: 'Keine Werbung', feat4: 'Prioritäts-Support', feat5: 'Bis zu 5 Geräte', processing: 'Verarbeitung...', success_title: 'Zahlung erfolgreich! 🎉', success_desc: 'Ihr Abo ist jetzt aktiv.', success_close: 'Schließen', error: 'Etwas ist schiefgelaufen' },
  fa: { title: 'Doppler VPN Pro', subtitle: 'سرعت نامحدود، همه سرورها، بدون تبلیغات', monthly: 'ماهانه', sixMonth: '6 ماه', yearly: 'سالانه', bestValue: 'بهترین پیشنهاد', save: 'صرفه‌جویی', subscribe: 'اشتراک', perMonth: '/ماه', features: 'امکانات', feat1: 'همه سرورها', feat2: 'پهنای باند نامحدود', feat3: 'بدون تبلیغات', feat4: 'پشتیبانی ویژه', feat5: 'تا 5 دستگاه', processing: '...در حال پردازش', success_title: '!پرداخت موفق 🎉', success_desc: '.اشتراک شما فعال شد', success_close: 'بستن', error: 'خطایی رخ داد' },
  uk: { title: 'Doppler VPN Pro', subtitle: 'Безлімітна швидкість, всі сервери, без реклами', monthly: 'Місяць', sixMonth: '6 місяців', yearly: 'Рік', bestValue: 'Найкраща пропозиція', save: 'Економія', subscribe: 'Підписатися', perMonth: '/міс', features: 'Що ви отримаєте', feat1: 'Всі сервери', feat2: 'Безлімітний трафік', feat3: 'Без реклами', feat4: 'Пріоритетна підтримка', feat5: 'До 5 пристроїв', processing: 'Обробка...', success_title: 'Оплата успішна! 🎉', success_desc: 'Вашу підписку активовано.', success_close: 'Закрити', error: 'Щось пішло не так' },
  tr: { title: 'Doppler VPN Pro', subtitle: 'Sınırsız hız, tüm sunucular, reklam yok', monthly: 'Aylık', sixMonth: '6 Ay', yearly: 'Yıllık', bestValue: 'En iyi teklif', save: 'Tasarruf', subscribe: 'Abone ol', perMonth: '/ay', features: 'Neler alırsınız', feat1: 'Tüm sunucular', feat2: 'Sınırsız bant genişliği', feat3: 'Reklam yok', feat4: 'Öncelikli destek', feat5: '5 cihaza kadar', processing: 'İşleniyor...', success_title: 'Ödeme başarılı! 🎉', success_desc: 'Aboneliğiniz aktif.', success_close: 'Kapat', error: 'Bir şeyler yanlış gitti' },
  ko: { title: 'Doppler VPN Pro', subtitle: '무제한 속도, 모든 서버, 광고 없음', monthly: '월간', sixMonth: '6개월', yearly: '연간', bestValue: '최고 혜택', save: '절약', subscribe: '구독', perMonth: '/월', features: '혜택', feat1: '모든 서버', feat2: '무제한 대역폭', feat3: '광고 없음', feat4: '우선 지원', feat5: '최대 5대', processing: '처리 중...', success_title: '결제 성공! 🎉', success_desc: '구독이 활성화되었습니다.', success_close: '닫기', error: '문제가 발생했습니다' },
  fr: { title: 'Doppler VPN Pro', subtitle: 'Vitesse illimitée, tous les serveurs, sans publicité', monthly: 'Mensuel', sixMonth: '6 Mois', yearly: 'Annuel', bestValue: 'Meilleure offre', save: 'Économisez', subscribe: "S'abonner", perMonth: '/mois', features: 'Ce que vous obtenez', feat1: 'Tous les serveurs', feat2: 'Bande passante illimitée', feat3: 'Sans publicité', feat4: 'Support prioritaire', feat5: "Jusqu'à 5 appareils", processing: 'Traitement...', success_title: 'Paiement réussi ! 🎉', success_desc: 'Votre abonnement est actif.', success_close: 'Fermer', error: "Quelque chose s'est mal passé" },
  it: { title: 'Doppler VPN Pro', subtitle: 'Velocità illimitata, tutti i server, senza pubblicità', monthly: 'Mensile', sixMonth: '6 Mesi', yearly: 'Annuale', bestValue: 'Migliore offerta', save: 'Risparmia', subscribe: 'Abbonati', perMonth: '/mese', features: 'Cosa ottieni', feat1: 'Tutti i server', feat2: 'Banda illimitata', feat3: 'Senza pubblicità', feat4: 'Supporto prioritario', feat5: 'Fino a 5 dispositivi', processing: 'Elaborazione...', success_title: 'Pagamento riuscito! 🎉', success_desc: 'Il tuo abbonamento è attivo.', success_close: 'Chiudi', error: 'Qualcosa è andato storto' },
  pl: { title: 'Doppler VPN Pro', subtitle: 'Nielimitowana prędkość, wszystkie serwery, bez reklam', monthly: 'Miesięcznie', sixMonth: '6 Miesięcy', yearly: 'Rocznie', bestValue: 'Najlepsza oferta', save: 'Oszczędź', subscribe: 'Subskrybuj', perMonth: '/mies', features: 'Co otrzymasz', feat1: 'Wszystkie serwery', feat2: 'Nieograniczona przepustowość', feat3: 'Bez reklam', feat4: 'Priorytetowe wsparcie', feat5: 'Do 5 urządzeń', processing: 'Przetwarzanie...', success_title: 'Płatność zakończona! 🎉', success_desc: 'Twoja subskrypcja jest aktywna.', success_close: 'Zamknij', error: 'Coś poszło nie tak' },
  nl: { title: 'Doppler VPN Pro', subtitle: 'Onbeperkte snelheid, alle servers, geen advertenties', monthly: 'Maandelijks', sixMonth: '6 Maanden', yearly: 'Jaarlijks', bestValue: 'Beste aanbieding', save: 'Bespaar', subscribe: 'Abonneren', perMonth: '/mnd', features: 'Wat je krijgt', feat1: 'Alle servers', feat2: 'Onbeperkte bandbreedte', feat3: 'Geen advertenties', feat4: 'Prioriteit ondersteuning', feat5: 'Tot 5 apparaten', processing: 'Verwerken...', success_title: 'Betaling geslaagd! 🎉', success_desc: 'Je abonnement is actief.', success_close: 'Sluiten', error: 'Er ging iets mis' },
  id: { title: 'Doppler VPN Pro', subtitle: 'Kecepatan tak terbatas, semua server, tanpa iklan', monthly: 'Bulanan', sixMonth: '6 Bulan', yearly: 'Tahunan', bestValue: 'Penawaran terbaik', save: 'Hemat', subscribe: 'Berlangganan', perMonth: '/bln', features: 'Yang Anda dapatkan', feat1: 'Semua server', feat2: 'Bandwidth tak terbatas', feat3: 'Tanpa iklan', feat4: 'Dukungan prioritas', feat5: 'Hingga 5 perangkat', processing: 'Memproses...', success_title: 'Pembayaran berhasil! 🎉', success_desc: 'Langganan Anda aktif.', success_close: 'Tutup', error: 'Terjadi kesalahan' },
  th: { title: 'Doppler VPN Pro', subtitle: 'ความเร็วไม่จำกัด เซิร์ฟเวอร์ทั้งหมด ไม่มีโฆษณา', monthly: 'รายเดือน', sixMonth: '6 เดือน', yearly: 'รายปี', bestValue: 'คุ้มที่สุด', save: 'ประหยัด', subscribe: 'สมัครสมาชิก', perMonth: '/เดือน', features: 'สิ่งที่คุณจะได้รับ', feat1: 'เซิร์ฟเวอร์ทั้งหมด', feat2: 'แบนด์วิดท์ไม่จำกัด', feat3: 'ไม่มีโฆษณา', feat4: 'การสนับสนุนแบบพิเศษ', feat5: 'สูงสุด 5 อุปกรณ์', processing: 'กำลังดำเนินการ...', success_title: 'ชำระเงินสำเร็จ! 🎉', success_desc: 'การสมัครสมาชิกของคุณเปิดใช้งานแล้ว', success_close: 'ปิด', error: 'เกิดข้อผิดพลาด' },
  vi: { title: 'Doppler VPN Pro', subtitle: 'Tốc độ không giới hạn, tất cả máy chủ, không quảng cáo', monthly: 'Hàng tháng', sixMonth: '6 Tháng', yearly: 'Hàng năm', bestValue: 'Ưu đãi tốt nhất', save: 'Tiết kiệm', subscribe: 'Đăng ký', perMonth: '/tháng', features: 'Bạn nhận được', feat1: 'Tất cả máy chủ', feat2: 'Băng thông không giới hạn', feat3: 'Không quảng cáo', feat4: 'Hỗ trợ ưu tiên', feat5: 'Tối đa 5 thiết bị', processing: 'Đang xử lý...', success_title: 'Thanh toán thành công! 🎉', success_desc: 'Gói đăng ký đã được kích hoạt.', success_close: 'Đóng', error: 'Đã xảy ra lỗi' },
  ro: { title: 'Doppler VPN Pro', subtitle: 'Viteză nelimitată, toate serverele, fără reclame', monthly: 'Lunar', sixMonth: '6 Luni', yearly: 'Anual', bestValue: 'Cea mai bună ofertă', save: 'Economisește', subscribe: 'Abonează-te', perMonth: '/lună', features: 'Ce primești', feat1: 'Toate serverele', feat2: 'Lățime de bandă nelimitată', feat3: 'Fără reclame', feat4: 'Suport prioritar', feat5: 'Până la 5 dispozitive', processing: 'Se procesează...', success_title: 'Plată reușită! 🎉', success_desc: 'Abonamentul tău este activ.', success_close: 'Închide', error: 'Ceva a mers prost' },
};

export function getTranslation(lang: string): Record<string, string> {
  return translations[lang] || translations['en'];
}

export function detectLanguage(): string {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp?.initDataUnsafe?.user?.language_code) {
    const lang = window.Telegram.WebApp.initDataUnsafe.user.language_code;
    if (translations[lang]) return lang;
    // Try 2-letter prefix
    const prefix = lang.slice(0, 2);
    if (translations[prefix]) return prefix;
  }
  return 'en';
}
