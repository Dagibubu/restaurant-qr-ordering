import 'dotenv/config';
import bcrypt from 'bcryptjs';
import QRCode from 'qrcode';
import { connectDB, sequelize } from './config/db.js';
import {
  User,
  Category,
  MenuItem,
  Table,
  Order,
} from './models/index.js';

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

/*  ───────────────────────────────────────────
    Test credentials
─────────────────────────────────────────── */
const USERS = [
  { name: 'Admin',      email: 'admin@test.com', password: 'admin123', role: 'admin' },
  { name: 'Sarah Wait', email: 'staff@test.com', password: 'staff123', role: 'staff' },
  { name: 'Marco Chef', email: 'chef@test.com',  password: 'chef123',  role: 'staff' },
];

/*  ───────────────────────────────────────────
    Menu data
─────────────────────────────────────────── */
const MENU = {
  Starters: [
    { name: 'Bruschetta', description: 'Toasted sourdough, tomatoes, basil, olive oil', price: 7.5, image: 'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?w=600' },
    { name: 'Calamari Fritti', description: 'Crispy squid, lemon aioli', price: 11.0, image: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=600' },
    { name: 'Caprese Salad', description: 'Buffalo mozzarella, tomatoes, pesto', price: 9.5, image: 'https://images.unsplash.com/photo-1592417817098-8fd3d9eb14a5?w=600' },
  ],
  Mains: [
    { name: 'Margherita Pizza', description: 'San Marzano tomatoes, mozzarella, fresh basil', price: 13.0, image: 'https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?w=600' },
    { name: 'Spaghetti Carbonara', description: 'Guanciale, egg yolk, pecorino romano', price: 15.5, image: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=600' },
    { name: 'Grilled Salmon', description: 'Atlantic salmon, lemon butter, seasonal vegetables', price: 22.0, image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=600' },
    { name: 'Ribeye Steak', description: '250g ribeye, rosemary butter, fries', price: 28.0, image: 'https://images.unsplash.com/photo-1546964124-0cce460f38ef?w=600' },
    { name: 'Risotto ai Funghi', description: 'Carnaroli rice, porcini mushrooms, parmesan', price: 17.5, image: 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=600' },
    { name: 'Chicken Parmigiana', description: 'Breaded chicken, tomato sauce, mozzarella', price: 16.5, image: 'https://images.unsplash.com/photo-1632778149955-e80f8ceca2e8?w=600' },
  ],
  Desserts: [
    { name: 'Tiramisu', description: 'Mascarpone, espresso-soaked ladyfingers, cocoa', price: 8.0, image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=600' },
    { name: 'Panna Cotta', description: 'Vanilla cream, berry coulis', price: 7.5, image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600' },
    { name: 'Chocolate Lava Cake', description: 'Warm dark chocolate, vanilla ice cream', price: 9.0, image: 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=600' },
  ],
  Drinks: [
    { name: 'Espresso', description: 'Double shot, Italian roast', price: 3.0, image: 'https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?w=600' },
    { name: 'Fresh Orange Juice', description: 'Freshly squeezed', price: 5.0, image: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=600' },
    { name: 'House Red Wine', description: 'Chianti, glass 175ml', price: 8.0, image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=600' },
    { name: 'Craft Beer', description: 'Local IPA, 330ml', price: 6.5, image: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=600' },
  ],
};

const TABLES = ['1', '2', '3', '4', '5', '6', '7', '8'];

/*  ───────────────────────────────────────────
    Main
─────────────────────────────────────────── */
async function seed() {
  try {
    await connectDB();
    console.log('🌱 Seeding database…\n');

    /* ── Clean slate ── */
    console.log('🗑️  Clearing existing data…');
    await Order.destroy({ where: {}, truncate: true });
    await MenuItem.destroy({ where: {}, truncate: true });
    await Category.destroy({ where: {}, truncate: true });
    await Table.destroy({ where: {}, truncate: true });
    await User.destroy({ where: {}, truncate: true });

    /* ── Users ── */
    console.log('\n👤 Creating users…');
    for (const u of USERS) {
      const hashed = await bcrypt.hash(u.password, 10);
      const created = await User.create({
        name: u.name,
        email: u.email,
        password: hashed,
        role: u.role,
      });
      console.log(`   ✅ ${created.role.padEnd(6)} → ${created.email}  (pw: ${u.password})`);
    }

    /* ── Categories + Menu Items ── */
    console.log('\n📂 Creating categories & menu items…');
    let order = 0;
    for (const [catName, items] of Object.entries(MENU)) {
      const category = await Category.create({ name: catName, order: order++ });
      console.log(`   📁 ${catName}`);
      for (const it of items) {
        await MenuItem.create({
          name: it.name,
          description: it.description,
          price: it.price,
          image: it.image,
          categoryId: category.id,
          available: true,
        });
        console.log(`      • ${it.name}  $${it.price.toFixed(2)}`);
      }
    }

    /* ── Tables + QR codes ── */
    console.log('\n🪑 Creating tables & QR codes…');
    for (const number of TABLES) {
      const table = await Table.create({ number });
      const url = `${CLIENT_URL}/order/${table.id}`;
      table.qrCode = await QRCode.toDataURL(url);
      await table.save();
      console.log(`   ✅ Table ${number} → ${url}`);
    }

    /* ── Done ── */
    console.log('\n' + '═'.repeat(60));
    console.log('🎉 Seed complete!\n');
    console.log('🔐 LOGIN CREDENTIALS');
    console.log('─'.repeat(60));
    console.log('   ADMIN');
    console.log('     Email:    admin@test.com');
    console.log('     Password: admin123');
    console.log('     → http://localhost:5173/login → /admin');
    console.log('');
    console.log('   STAFF (waitstaff)');
    console.log('     Email:    staff@test.com');
    console.log('     Password: staff123');
    console.log('');
    console.log('   STAFF (chef)');
    console.log('     Email:    chef@test.com');
    console.log('     Password: chef123');
    console.log('     → http://localhost:5173/login → /staff');
    console.log('');
    console.log('🌐 Customer demo URLs');
    console.log('─'.repeat(60));
    const tables = await Table.findAll({ order: [['number', 'ASC']] });
    tables.slice(0, 3).forEach((t) => {
      console.log(`   Table ${t.number}: ${CLIENT_URL}/order/${t.id}`);
    });
    console.log(`   … and ${Math.max(0, tables.length - 3)} more tables`);
    console.log('═'.repeat(60));

    await sequelize.close();
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Seed failed:', err);
    process.exit(1);
  }
}

seed();