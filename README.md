git clone (git_link)
cd bid2buy
npm install
npm run dev   # or: npm start

Add .env
[
NEXTAUTH_SECRET = ""
NODE_ENV = "development"
DATABASE_URL = ""

]

git clone (git_link)
cd bid2buy
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run dev   # or: npm start

