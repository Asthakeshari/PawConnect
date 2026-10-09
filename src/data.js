const p=(id,name,species,breed,age,gender,size,location,vax,behaviour,reason,ownerId='u_owner',vid='')=>({id,name,species,breed,age,gender,size,location,vaccinated:vax,medical:vax?'Fully vaccinated, dewormed, microchipped':'Vaccination pending',behaviour,reason,ownerId,video:vid,
photos:[`https://loremflickr.com/640/480/${species.toLowerCase()}?lock=${id.length*7+parseInt(id.slice(1))}`,`https://loremflickr.com/640/480/${species.toLowerCase()},pet?lock=${parseInt(id.slice(1))+50}`]});
export const SEED_PETS=[
p('p1','Biscuit','Dog','Labrador Retriever',2,'Male','Large','Bareilly, UP',true,'Friendly, energetic, great with kids','Owner relocating abroad'),
p('p2','Luna','Cat','Indian Shorthair',1,'Female','Small','Lucknow, UP',true,'Calm, cuddly, litter trained','Family allergy'),
p('p3','Rocky','Dog','Indie / Pariah',3,'Male','Medium','Delhi',true,'Loyal, protective, needs training','Rescued from street','u_ngo'),
p('p4','Mochi','Rabbit','Holland Lop',1,'Female','Small','Pune, MH',false,'Gentle, shy at first','Too many pets at home'),
p('p5','Daisy','Dog','Beagle',4,'Female','Medium','Bengaluru, KA',true,'Playful, loves walks, vocal','Owner no longer has time'),
p('p6','Simba','Cat','Persian',5,'Male','Medium','Mumbai, MH',true,'Lazy lap cat, needs grooming','Owner moving to smaller flat','u_ngo'),
p('p7','Coco','Bird','Cockatiel',2,'Female','Small','Jaipur, RJ',false,'Chatty, whistles, hand-tame','Owner health reasons'),
p('p8','Bruno','Dog','German Shepherd',6,'Male','Large','Bareilly, UP',true,'Obedient, calm, needs space','Senior owner cannot manage','u_ngo')];
export const ROLES=[['adopter','Adopter'],['owner','Pet Owner'],['ngo','NGO / Shelter'],['volunteer','Volunteer'],['admin','Admin']];
export const PUBLIC_ROLES=ROLES.filter(r=>r[0]!=='admin');
export const SEED_PEOPLE={u_owner:{name:'Asha Verma',role:'owner'},u_ngo:{name:'Happy Tails Shelter',role:'ngo'}};
