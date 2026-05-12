import 'dotenv/config';
import wolfjs from 'wolf.js';

const { WOLF } = wolfjs;

const settings = {
    identity: process.env.U_MAIL,
    secret: process.env.U_PASS,
    targetIds: [80055399, 0], // تأكد من رقم العضوية 0 هل هو صحيح؟
    targetRoomId: 9969,
    allianceId: "5550005",
    commandDelay: 1500
};

const service = new WOLF();
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

service.on('ready', () => {
    console.log(`✅ البوت جاهز: ${service.currentSubscriber.nickname}`);
    console.log(`📡 يراقب الخاص من: ${settings.targetIds.join(' , ')}`);
});

service.on('message', async (message) => {
    // استخراج معرف المرسل بطريقتين لضمان التوافق مع إصدار المكتبة
    const senderId = message.sourceSubscriberId || message.authorId;
    
    // فحص: هل الرسالة خاصة؟ (ليست من مجموعة) وهل المرسل ضمن القائمة؟
    if (!message.isGroup && settings.targetIds.includes(senderId)) {
        
        // استخراج نص الرسالة بطرق مختلفة لضمان القراءة
        const content = (message.body || message.content || "").trim();
        console.log(`📩 رسالة خاصة جديدة من [${senderId}]: ${content}`);

        // 1. حالة: !او موسم قطع
        if (content.includes("!او موسم قطع")) {
            await sleep(settings.commandDelay);
            await service.messaging.sendGroupMessage(settings.targetRoomId, "!مد موسم قطع");
            console.log(`✅ تم إرسال: !مد موسم قطع`);
            return;
        }

        // 2. حالة: !او مزاد
        const auctionMatch = content.match(/!او مزاد\s+(\d+)/);
        if (auctionMatch) {
            const auctionId = auctionMatch[1];
            try {
                await service.messaging.sendGroupMessage(settings.targetRoomId, `!مد تحالف سحب ${settings.allianceId}`);
                await sleep(settings.commandDelay);
                await service.messaging.sendGroupMessage(settings.targetRoomId, `!مد مزايدة ${auctionId} ${settings.allianceId}`);
                console.log(`✅ تم تنفيذ أوامر المزاد رقم: ${auctionId}`);
            } catch (err) {
                console.error(`❌ خطأ أثناء الإرسال: ${err.message}`);
            }
        }
    } else if (!message.isGroup) {
        // سطر اختياري للتصحيح: يطبع أي رسالة خاصة تصل من شخص غير مستهدف
        console.log(`ℹ️ رسالة خاصة من مستخدم غير مدرج [${senderId}]`);
    }
});

service.login(settings.identity, settings.secret);
