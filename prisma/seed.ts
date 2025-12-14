import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');


  // --------------------
  // Create Users
  // --------------------
  const users: any[] = [];

  for (let i = 0; i < 5; i++) {
    const hashedPassword = await bcrypt.hash('password123', 10);

    const user = await prisma.user.create({
      data: {
        email: faker.internet.email(),
        username: faker.internet.username(),
        password: hashedPassword,
        name: faker.person.fullName(),
        avatar: null,
        bio: faker.lorem.sentence(),
      },
    });

    users.push(user);
  }

  console.log(`✅ Created ${users.length} users`);

  // --------------------
  // Create Posts
  // --------------------
  const posts: any[] = [];

  for (const user of users) {
    const post = await prisma.post.create({
      data: {
        imageUrl: 'https://picsum.photos/600',
        caption: faker.lorem.sentence(),
        authorId: user.id,
      },
    });

    posts.push(post);
  }

  console.log(`✅ Created ${posts.length} posts`);

  // --------------------
  // Create Follows
  // --------------------
  for (let i = 0; i < users.length; i++) {
    for (let j = 0; j < users.length; j++) {
      if (i !== j) {
        await prisma.follow.create({
          data: {
            followerId: users[i].id,
            followingId: users[j].id,
          },
        });
      }
    }
  }

  console.log('✅ Created follows');

  // --------------------
  // Create Likes
  // --------------------
  for (const post of posts) {
    for (const user of users) {
      // Random likes
      if (Math.random() > 0.5) {
        await prisma.like.create({
          data: {
            userId: user.id,
            postId: post.id,
          },
        });
      }
    }
  }

  console.log('✅ Created likes');
}

main()
  .then(() => {
    console.log('🌱 Seeding finished');
  })
  .catch((err) => {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
