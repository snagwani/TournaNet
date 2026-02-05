import { PrismaClient, UserRole, Gender, AthleteCategory, EventType, ResultStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Starting Comprehensive Seed Process ---');

    // 1. Create Users
    const adminEmail = 'admin@tournanet.app';
    const scorerEmail = 'scorer@tournanet.app';
    const passwordHash = await bcrypt.hash('admin123', 10);
    const scorerHash = await bcrypt.hash('scorer123', 10);

    await prisma.user.upsert({
        where: { email: adminEmail },
        update: { passwordHash, role: UserRole.ADMIN },
        create: { email: adminEmail, passwordHash, role: UserRole.ADMIN },
    });

    await prisma.user.upsert({
        where: { email: scorerEmail },
        update: { passwordHash: scorerHash, role: UserRole.SCORER },
        create: { email: scorerEmail, passwordHash: scorerHash, role: UserRole.SCORER },
    });
    console.log('✅ Users Created');

    // 2. Create Schools
    const schools = [
        { name: 'St. Marys Academy', district: 'Mumbai North', shortCode: 'SMA' },
        { name: 'Global International', district: 'Mumbai South', shortCode: 'GIS' },
        { name: 'Delhi Public School', district: 'Delhi Central', shortCode: 'DPS' },
        { name: 'Heritage School', district: 'Pune West', shortCode: 'HS' },
        { name: 'Bright Future School', district: 'Bangalore East', shortCode: 'BFS' },
    ];

    const schoolRecords = [];
    for (const s of schools) {
        const school = await (prisma.school as any).upsert({
            where: { shortCode: s.shortCode },
            update: {},
            create: {
                ...s,
                contactName: 'Principal ' + s.shortCode,
                contactEmail: 'contact@' + s.shortCode.toLowerCase() + '.edu',
            },
        });
        schoolRecords.push(school);
    }
    console.log('✅ Schools Created');

    // 3. Create Events with varied dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const categories = [AthleteCategory.U14, AthleteCategory.U17];
    const genders = [Gender.MALE, Gender.FEMALE];

    const eventConfigs = [
        // Past events (for results)
        { name: '100m Sprint', type: EventType.TRACK, date: yesterday, time: '09:00' },
        { name: '200m Sprint', type: EventType.TRACK, date: yesterday, time: '10:00' },
        // Today's events (for live/current)
        { name: '400m Dash', type: EventType.TRACK, date: today, time: '09:00' },
        { name: 'Long Jump', type: EventType.FIELD, date: today, time: '14:00' },
        // Future events (for upcoming)
        { name: 'High Jump', type: EventType.FIELD, date: tomorrow, time: '10:00' },
        { name: 'Shot Put', type: EventType.FIELD, date: nextWeek, time: '11:00' },
    ];

    const eventRecords = [];
    for (const cat of categories) {
        for (const gen of genders) {
            for (const config of eventConfigs) {
                const e = await prisma.event.upsert({
                    where: { name_gender_category: { name: config.name, gender: gen, category: cat } },
                    update: {},
                    create: {
                        name: config.name,
                        eventType: config.type,
                        gender: gen,
                        category: cat,
                        date: config.date,
                        startTime: config.time,
                        rules: config.type === EventType.TRACK
                            ? { maxAthletesPerHeat: 8, qualificationRule: 'TOP_2_PER_HEAT' }
                            : { maxAthletesPerFlight: 12, attempts: 3, finalists: 8 }
                    }
                });
                eventRecords.push(e);
            }
        }
    }
    console.log(`✅ ${eventRecords.length} Events Created`);

    // 4. Create Athletes
    const athleteRecords = [];
    const maleNames = [
        'Rajesh Kumar', 'Amit Singh', 'Vikram Rao', 'Arjun Mehta',
        'Karan Verma', 'Rohit Nair', 'Siddharth Shah', 'Aditya Kulkarni',
        'Varun Chopra', 'Nikhil Agarwal'
    ];
    const femaleNames = [
        'Priya Sharma', 'Neha Patel', 'Sneha Gupta', 'Pooja Desai',
        'Anjali Joshi', 'Divya Iyer', 'Kavya Reddy', 'Riya Malhotra',
        'Ishita Bansal', 'Tanvi Saxena'
    ];

    let maleNameIndex = 0;
    let femaleNameIndex = 0;
    for (const school of schoolRecords) {
        const distCode = school.district.substring(0, 3).toUpperCase();
        for (let i = 0; i < 8; i++) {
            const gender = i < 4 ? Gender.MALE : Gender.FEMALE;
            const category = i % 2 === 0 ? AthleteCategory.U14 : AthleteCategory.U17;
            const age = category === AthleteCategory.U14 ? 13 : 16;

            let name = '';
            if (gender === Gender.MALE) {
                name = maleNames[maleNameIndex % maleNames.length];
                maleNameIndex++;
            } else {
                name = femaleNames[femaleNameIndex % femaleNames.length];
                femaleNameIndex++;
            }

            const bibNumber = `${distCode}-${school.shortCode}-${(i + 1).toString().padStart(3, '0')}`;

            const athlete = await prisma.athlete.upsert({
                where: { bibNumber },
                update: {},
                create: {
                    name,
                    age,
                    gender,
                    category,
                    bibNumber,
                    schoolId: school.id,
                    personalBest: gender === Gender.MALE ? '11.2s' : '12.8s'
                }
            });
            athleteRecords.push(athlete);

            // Register for matching events (max 3 per athlete)
            const matchingEvents = eventRecords.filter(e => e.gender === gender && e.category === category);
            // Randomly select up to 3 events to respect the business rule
            const shuffled = [...matchingEvents].sort(() => Math.random() - 0.5);
            const selectedEvents = shuffled.slice(0, 3);

            for (const event of selectedEvents) {
                await (prisma as any).eventRegistration.upsert({
                    where: { athleteId_eventId: { athleteId: athlete.id, eventId: event.id } },
                    update: {},
                    create: { athleteId: athlete.id, eventId: event.id }
                });
            }
        }
    }
    console.log(`✅ ${athleteRecords.length} Athletes Created and Registered`);

    // 5. Create Heats and Results
    let heatsCreated = 0;
    let resultsCreated = 0;

    for (const event of eventRecords) {
        // Get registered athletes for this event
        const registrations = await prisma.eventRegistration.findMany({
            where: { eventId: event.id },
            include: { athlete: true }
        });

        if (registrations.length === 0) continue;

        // Create 1-2 heats per event
        const athletesPerHeat = 8;
        const numHeats = Math.ceil(registrations.length / athletesPerHeat);

        for (let heatNum = 1; heatNum <= Math.min(numHeats, 2); heatNum++) {
            const heat = await prisma.heat.upsert({
                where: {
                    eventId_heatNumber: {
                        eventId: event.id,
                        heatNumber: heatNum
                    }
                },
                update: {},
                create: {
                    eventId: event.id,
                    heatNumber: heatNum
                }
            });
            heatsCreated++;

            // Assign athletes to lanes
            const startIdx = (heatNum - 1) * athletesPerHeat;
            const heatAthletes = registrations.slice(startIdx, startIdx + athletesPerHeat);

            for (let lane = 1; lane <= heatAthletes.length; lane++) {
                const reg = heatAthletes[lane - 1];
                await prisma.heatLane.create({
                    data: {
                        heatId: heat.id,
                        laneNumber: lane,
                        athleteId: reg.athleteId
                    }
                });

                // Add results for past events only
                if (event.date < today) {
                    const rank = lane;
                    const resultValue = event.eventType === EventType.TRACK
                        ? `${(10.5 + Math.random() * 2).toFixed(2)}s`
                        : `${(5.0 + Math.random() * 2).toFixed(2)}m`;

                    await prisma.result.create({
                        data: {
                            heatId: heat.id,
                            athleteId: reg.athleteId,
                            bibNumber: reg.athlete.bibNumber,
                            status: ResultStatus.FINISHED,
                            resultValue,
                            rank: rank <= 3 ? rank : null
                        }
                    });
                    resultsCreated++;
                }
            }
        }
    }

    console.log(`✅ ${heatsCreated} Heats Created`);
    console.log(`✅ ${resultsCreated} Results Created`);
    console.log('--- Seed Process Completed Successfully ---');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
