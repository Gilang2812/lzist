const fs = require('fs');

const rawData = `Nama Produk	Item ID	Variasi	Variasi ID	Stok	Harga 
Lazoulé - Pashmina TENCEL | Basic Tencel Shawl	47158306682	Hitam	365735307947	100	56700
Lazoulé - Pashmina TENCEL | Basic Tencel Shawl	47158306682	Iron Grey	365735307941	99	56700
Lazoulé - Pashmina TENCEL | Basic Tencel Shawl	47158306682	Ruby	365735307942	100	56700
Lazoulé - Pashmina TENCEL | Basic Tencel Shawl	47158306682	Lavender	365735307943	100	56700
Lazoulé - Pashmina TENCEL | Basic Tencel Shawl	47158306682	Dark Brown	365735307948	98	56700
Lazoulé - Pashmina TENCEL | Basic Tencel Shawl	47158306682	Sand	365735307949	99	56700
Lazoulé - Pashmina TENCEL | Basic Tencel Shawl	47158306682	Carob	365735307944	99	56700
Lazoulé - Pashmina TENCEL | Basic Tencel Shawl	47158306682	Navy	365735307945	100	56700
Lazoulé - Pashmina TENCEL | Basic Tencel Shawl	47158306682	BW	365735307950	100	56700
Lazoulé - Pashmina TENCEL | Basic Tencel Shawl	47158306682	Nude	365735307946	100	56700
Lazoulé - Pashmina TENCEL | Basic Tencel Shawl	47158306682	Bue Grey	365735307940	100	56700
Lazoulé - Pashmina Modal Viscose | Modal Viscose Shawl	48308287626	Hitam	345734031211	500	59800
Lazoulé - Pashmina Modal Viscose | Modal Viscose Shawl	48308287626	Oat	345734031220	0	59800
Lazoulé - Pashmina Modal Viscose | Modal Viscose Shawl	48308287626	Rain	345734031213	499	59800
Lazoulé - Pashmina Modal Viscose | Modal Viscose Shawl	48308287626	Coffe	345734031221	500	59800
Lazoulé - Pashmina Modal Viscose | Modal Viscose Shawl	48308287626	Navy	345734031222	0	59800
Lazoulé - Pashmina Modal Viscose | Modal Viscose Shawl	48308287626	Red Wine	345734031223	500	59800
Lazoulé - Pashmina Modal Viscose | Modal Viscose Shawl	48308287626	Machiato	345734031212	500	59800
Lazoulé - Pashmina Modal Viscose | Modal Viscose Shawl	48308287626	Maroon	345734031216	499	59800
Lazoulé - Pashmina Modal Viscose | Modal Viscose Shawl	48308287626	Khaki	345734031224	497	59800
Lazoulé - Pashmina Modal Viscose | Modal Viscose Shawl	48308287626	Powder	345734031214	499	59800
Lazoulé - Pashmina Modal Viscose | Modal Viscose Shawl	48308287626	Burgundy	345734031219	500	59800
Lazoulé - Pashmina Modal Viscose | Modal Viscose Shawl	48308287626	Frappucino	345734031217	0	59800
Lazoulé - Pashmina Modal Viscose | Modal Viscose Shawl	48308287626	Silver	345734031218	500	59800
Lazoulé - Pashmina Modal Viscose | Modal Viscose Shawl	48308287626	BW	345734031215	499	59800
Lazoulé - Pashmina Kaos Rayon Premium | Turkish Shawl	52008267608	Hitam	425734033768	499	37800
Lazoulé - Pashmina Kaos Rayon Premium | Turkish Shawl	52008267608	Navy	425734033769	499	37800
Lazoulé - Pashmina Kaos Rayon Premium | Turkish Shawl	52008267608	Sand	425734033770	0	37800
Lazoulé - Pashmina Kaos Rayon Premium | Turkish Shawl	52008267608	Silver	425734033774	500	37800
Lazoulé - Pashmina Kaos Rayon Premium | Turkish Shawl	52008267608	BW	425734033778	500	37800
Lazoulé - Pashmina Kaos Rayon Premium | Turkish Shawl	52008267608	Abu Tua	425734033775	499	37800
Lazoulé - Pashmina Kaos Rayon Premium | Turkish Shawl	52008267608	Hazel	425734033763	498	37800
Lazoulé - Pashmina Kaos Rayon Premium | Turkish Shawl	52008267608	Cream	425734033771	499	37800
Lazoulé - Pashmina Kaos Rayon Premium | Turkish Shawl	52008267608	Mocca	425734033779	0	37800
Lazoulé - Pashmina Kaos Rayon Premium | Turkish Shawl	52008267608	Milo	425734033782	0	37800
Lazoulé - Pashmina Kaos Rayon Premium | Turkish Shawl	52008267608	Latte	425734033772	500	37800
Lazoulé - Pashmina Kaos Rayon Premium | Turkish Shawl	52008267608	Nude	410734033990	499	37800
Lazoulé - Pashmina Kaos Rayon Premium | Turkish Shawl	52008267608	Khaki	425734033776	500	37800
Lazoulé - Pashmina Kaos Rayon Premium | Turkish Shawl	52008267608	Denim	410734033991	500	37800
Lazoulé - Pashmina Kaos Rayon Premium | Turkish Shawl	52008267608	Maroon	425734033759	0	37800
Lazoulé - Pashmina Kaos Rayon Premium | Turkish Shawl	52008267608	Ivory	425734033764	499	37800
Lazoulé - Pashmina Kaos Rayon Premium | Turkish Shawl	52008267608	Soft Dusty	425734033756	500	37800
Lazoulé - Pashmina Kaos Rayon Premium | Turkish Shawl	52008267608	Baby Pink	425734033757	500	37800
Lazoulé - Pashmina Kaos Rayon Premium | Turkish Shawl	52008267608	Tan	425734033781	500	37800
Lazoulé - Pashmina Kaos Rayon Premium | Turkish Shawl	52008267608	Wafle	425734033765	500	37800
Lazoulé - Pashmina Kaos Rayon Premium | Turkish Shawl	52008267608	Coffee	425734033780	500	37800
Lazoulé - Pashmina Kaos Rayon Premium | Turkish Shawl	52008267608	Frappucino	425734033760	500	37800
Lazoulé - Pashmina Kaos Rayon Premium | Turkish Shawl	52008267608	Carob	425734033773	500	37800
Lazoulé - Pashmina Kaos Rayon Premium | Turkish Shawl	52008267608	Taupe	425734033766	0	37800
Lazoulé - Pashmina Kaos Rayon Premium | Turkish Shawl	52008267608	Powder Puff	425734033777	499	37800
Lazoulé - Pashmina Kaos Rayon Premium | Turkish Shawl	52008267608	Burgundy	425734033761	500	37800
Lazoulé - Pashmina Kaos Rayon Premium | Turkish Shawl	52008267608	Plum	425734033758	0	37800
Lazoulé - Pashmina Kaos Rayon Premium | Turkish Shawl	52008267608	Soft Lilac	425734033767	0	37800
Lazoulé - Pashmina Kaos Rayon Premium | Turkish Shawl	52008267608	Forest Green	425734033762	0	37800
Lazoulé - Pashmina Kaos Rayon Premium | Turkish Shawl	52008267608	Avocado	425734033783	0	37800
Lazoulé Hijab - Pashmina Voal | Arabian Voal Shawl | Voilee	53908272713	Hitam	410735144010	498	39950
Lazoulé Hijab - Pashmina Voal | Arabian Voal Shawl | Voilee	53908272713	Espresso	410735144004	500	39950
Lazoulé Hijab - Pashmina Voal | Arabian Voal Shawl | Voilee	53908272713	Maroon	410735143992	0	39950
Lazoulé Hijab - Pashmina Voal | Arabian Voal Shawl | Voilee	53908272713	Red Wine	410735143988	500	39950
Lazoulé Hijab - Pashmina Voal | Arabian Voal Shawl | Voilee	53908272713	Pearl	410735144001	0	39950
Lazoulé Hijab - Pashmina Voal | Arabian Voal Shawl | Voilee	53908272713	Wood	410735144003	500	39950
Lazoulé Hijab - Pashmina Voal | Arabian Voal Shawl | Voilee	53908272713	Navy	410735143999	500	39950
Lazoulé Hijab - Pashmina Voal | Arabian Voal Shawl | Voilee	53908272713	Light Denim	410735143995	500	39950
Lazoulé Hijab - Pashmina Voal | Arabian Voal Shawl | Voilee	53908272713	Deep Taupe	410735143989	0	39950
Lazoulé Hijab - Pashmina Voal | Arabian Voal Shawl | Voilee	53908272713	Vanilla Cream	410735143987	0	39950
Lazoulé Hijab - Pashmina Voal | Arabian Voal Shawl | Voilee	53908272713	Coffe	410735143985	0	39950
Lazoulé Hijab - Pashmina Voal | Arabian Voal Shawl | Voilee	53908272713	Oat	410735143998	0	39950
Lazoulé Hijab - Pashmina Voal | Arabian Voal Shawl | Voilee	53908272713	Ash Grey	410735143984	0	39950
Lazoulé Hijab - Pashmina Voal | Arabian Voal Shawl | Voilee	53908272713	Frappucino	410735143980	0	39950
Lazoulé Hijab - Pashmina Voal | Arabian Voal Shawl | Voilee	53908272713	Choco Plum	410735144005	500	39950
Lazoulé Hijab - Pashmina Voal | Arabian Voal Shawl | Voilee	53908272713	Coksu	410735144006	0	39950
Lazoulé Hijab - Pashmina Voal | Arabian Voal Shawl | Voilee	53908272713	BW	410735144000	500	39950
Lazoulé Hijab - Pashmina Voal | Arabian Voal Shawl | Voilee	53908272713	Ivory	410735144007	499	39950
Lazoulé Hijab - Pashmina Voal | Arabian Voal Shawl | Voilee	53908272713	Baby Pink	410735143996	500	39950
Lazoulé Hijab - Pashmina Voal | Arabian Voal Shawl | Voilee	53908272713	Deep Mahogany	410735143997	0	39950
Lazoulé Hijab - Pashmina Voal | Arabian Voal Shawl | Voilee	53908272713	Butter Cream	410735144002	500	39950
Lazoulé Hijab - Pashmina Voal | Arabian Voal Shawl | Voilee	53908272713	Burgundy	410735143986	500	39950
Lazoulé Hijab - Pashmina Voal | Arabian Voal Shawl | Voilee	53908272713	Grey Latte	410735143990	0	39950
Lazoulé Hijab - Pashmina Voal | Arabian Voal Shawl | Voilee	53908272713	Sky Blue	410735143993	0	39950
Lazoulé Hijab - Pashmina Voal | Arabian Voal Shawl | Voilee	53908272713	Milo	410735143981	500	39950
Lazoulé Hijab - Pashmina Voal | Arabian Voal Shawl | Voilee	53908272713	Soft Lilac	410735143982	0	39950
Lazoulé Hijab - Pashmina Voal | Arabian Voal Shawl | Voilee	53908272713	Choco Milk	410735143983	0	39950
Lazoulé Hijab - Pashmina Voal | Arabian Voal Shawl | Voilee	53908272713	Mauve	410735144008	0	39950
Lazoulé Hijab - Pashmina Voal | Arabian Voal Shawl | Voilee	53908272713	Rose Pink	410735143994	0	39950
Lazoulé Hijab - Pashmina Voal | Arabian Voal Shawl | Voilee	53908272713	Wine	410735143991	0	39950
Lazoulé Hijab - Pashmina Voal | Arabian Voal Shawl | Voilee	53908272713	Sand	410735144009	0	39950
Lazoulé- Pashmina Viscose Textured | Viscose Hightlight	44708292808	Smoke	272509239716	99	60795
Lazoulé- Pashmina Viscose Textured | Viscose Hightlight	44708292808	Coffe	272509239729	98	60795
Lazoulé- Pashmina Viscose Textured | Viscose Hightlight	44708292808	Nuttela	272509239721	100	60795
Lazoulé- Pashmina Viscose Textured | Viscose Hightlight	44708292808	Choco Blush	272509239711	100	60795
Lazoulé- Pashmina Viscose Textured | Viscose Hightlight	44708292808	Pistachio	272509239710	99	60795
Lazoulé- Pashmina Viscose Textured | Viscose Hightlight	44708292808	Dark Grey	272509239712	99	60795
Lazoulé- Pashmina Viscose Textured | Viscose Hightlight	44708292808	Charcoal	272509239722	99	60795
Lazoulé- Pashmina Viscose Textured | Viscose Hightlight	44708292808	Rose Nude	272509239723	99	60795
Lazoulé- Pashmina Viscose Textured | Viscose Hightlight	44708292808	Sand	272509239713	99	60795
Lazoulé- Pashmina Viscose Textured | Viscose Hightlight	44708292808	Brownie	272509239717	100	60795
Lazoulé- Pashmina Viscose Textured | Viscose Hightlight	44708292808	Espresso	272509239707	100	60795
Lazoulé- Pashmina Viscose Textured | Viscose Hightlight	44708292808	Stone Grey	272509239724	100	60795
Lazoulé- Pashmina Viscose Textured | Viscose Hightlight	44708292808	Cookies	272509239708	100	60795
Lazoulé- Pashmina Viscose Textured | Viscose Hightlight	44708292808	Choco Purple	272509239709	100	60795
Lazoulé- Pashmina Viscose Textured | Viscose Hightlight	44708292808	Chocolatte	272509239718	100	60795
Lazoulé- Pashmina Viscose Textured | Viscose Hightlight	44708292808	Granolla	272509239725	99	60795
Lazoulé- Pashmina Viscose Textured | Viscose Hightlight	44708292808	Burgundy	272509239719	99	60795
Lazoulé- Pashmina Viscose Textured | Viscose Hightlight	44708292808	Ivory	272509239726	100	60795
Lazoulé- Pashmina Viscose Textured | Viscose Hightlight	44708292808	Nude	272509239714	100	60795
Lazoulé- Pashmina Viscose Textured | Viscose Hightlight	44708292808	Baby Yellow	272509239727	100	60795
Lazoulé- Pashmina Viscose Textured | Viscose Hightlight	44708292808	Navy	272509239720	100	60795
Lazoulé- Pashmina Viscose Textured | Viscose Hightlight	44708292808	Yellow	272509239728	100	60795
Lazoulé- Pashmina Viscose Textured | Viscose Hightlight	44708292808	Bridge	272509239715	100	60795
Lazoulé - Hijab Segi Empat Paris Jadul Varisha | Paris Jadul Azara	47658293044	Hitam	277509275386	500	18870
Lazoulé - Hijab Segi Empat Paris Jadul Varisha | Paris Jadul Azara	47658293044	Maroon	277509275414	500	18870
Lazoulé - Hijab Segi Empat Paris Jadul Varisha | Paris Jadul Azara	47658293044	Navy	282509275323	500	18870
Lazoulé - Hijab Segi Empat Paris Jadul Varisha | Paris Jadul Azara	47658293044	Putih	277509275392	500	18870
Lazoulé - Hijab Segi Empat Paris Jadul Varisha | Paris Jadul Azara	47658293044	Biscuit	277509275387	498	18870
Lazoulé - Hijab Segi Empat Paris Jadul Varisha | Paris Jadul Azara	47658293044	ivory	277509275403	500	18870
Lazoulé - Hijab Segi Empat Paris Jadul Varisha | Paris Jadul Azara	47658293044	Espresso	282509275298	500	18870
Lazoulé - Hijab Segi Empat Paris Jadul Varisha | Paris Jadul Azara	47658293044	Ash Taupe	282509275316	500	18870
Lazoulé - Hijab Segi Empat Paris Jadul Varisha | Paris Jadul Azara	47658293044	Major	277509275404	500	18870
Lazoulé - Hijab Segi Empat Paris Jadul Varisha | Paris Jadul Azara	47658293044	iron	277509275393	500	18870
Lazoulé - Hijab Segi Empat Paris Jadul Varisha | Paris Jadul Azara	47658293044	Tortila	277509275410	500	18870
Lazoulé - Hijab Segi Empat Paris Jadul Varisha | Paris Jadul Azara	47658293044	Charcoal	277509275405	500	18870
Lazoulé - Hijab Segi Empat Paris Jadul Varisha | Paris Jadul Azara	47658293044	Taupe	282509275317	500	18870
Lazoulé - Hijab Segi Empat Paris Jadul Varisha | Paris Jadul Azara	47658293044	Softlate	282509275338	500	18870
Lazoulé - Hijab Segi Empat Paris Jadul Varisha | Paris Jadul Azara	47658293044	Moccalate	277509275415	500	18870
Lazoulé - Hijab Segi Empat Paris Jadul Varisha | Paris Jadul Azara	47658293044	Milo	277509275416	500	18870
Lazoulé - Hijab Segi Empat Paris Jadul Varisha | Paris Jadul Azara	47658293044	Alter	282509275299	500	18870
Lazoulé - Hijab Segi Empat Paris Jadul Varisha | Paris Jadul Azara	47658293044	Khaky	282509275331	500	18870
Lazoulé - Hijab Segi Empat Paris Jadul Varisha | Paris Jadul Azara	47658293044	Coffelate	282509275339	500	18870
Lazoulé - Hijab Segi Empat Paris Jadul Varisha | Paris Jadul Azara	47658293044	Sand	277509275394	500	18870
Lazoulé - Hijab Segi Empat Paris Jadul Varisha | Paris Jadul Azara	47658293044	Coksu	277509275388	500	18870
Lazoulé - Hijab Segi Empat Paris Jadul Varisha | Paris Jadul Azara	47658293044	Softnude	277509275396	500	18870
Lazoulé - Hijab Segi Empat Paris Jadul Varisha | Paris Jadul Azara	47658293044	Wood	282509275340	500	18870
Lazoulé - Hijab Segi Empat Paris Jadul Varisha | Paris Jadul Azara	47658293044	Milky	277509275389	500	18870
Lazoulé - Hijab Segi Empat Paris Jadul Varisha | Paris Jadul Azara	47658293044	Caramel	277509275380	500	18870
Lazoulé - Hijab Segi Empat Paris Jadul Varisha | Paris Jadul Azara	47658293044	Crimsom	277509275406	500	18870
Lazoulé - Hijab Segi Empat Paris Jadul Varisha | Paris Jadul Azara	47658293044	Cream	282509275300	500	18870
Lazoulé - Hijab Segi Empat Paris Jadul Varisha | Paris Jadul Azara	47658293044	Dark khaky	277509275420	500	18870
Lazoulé - Hijab Segi Empat Paris Jadul Varisha | Paris Jadul Azara	47658293044	Mocca sedang	282509275327	500	18870
Lazoulé - Hijab Segi Empat Paris Jadul Varisha | Paris Jadul Azara	47658293044	Deep army	282509275301	500	18870
Lazoulé - Hijab Segi Empat Paris Jadul Varisha | Paris Jadul Azara	47658293044	Ash grey	282509275309	499	18870
Lazoulé - Hijab Segi Empat Paris Jadul Varisha | Paris Jadul Azara	47658293044	Sage	277509275382	500	18870
Lazoulé - Hijab Segi Empat Paris Jadul Varisha | Paris Jadul Azara	47658293044	iced Blue	282509275310	500	18870
Lazoulé - Hijab Segi Empat Paris Jadul Varisha | Paris Jadul Azara	47658293044	Powder pink	282509275294	500	18870
Lazoulé - Hijab Segi Empat Paris Jadul Varisha | Paris Jadul Azara	47658293044	Fusia	277509275381	500	18870
Lazoulé - Hijab Segi Empat Paris Jadul Varisha | Paris Jadul Azara	47658293044	Yellow	282509275290	500	18870
Lazoulé - Hijab Segi Empat Paris Jadul Varisha | Paris Jadul Azara	47658293044	Sky Blue	282509275324	500	18870
Lazoulé - Hijab Segi Empat Paris Jadul Varisha | Paris Jadul Azara	47658293044	Army	277509275383	500	18870
Lazoulé - Hijab Segi Empat Paris Jadul Varisha | Paris Jadul Azara	47658293044	Mocca muda	282509275295	500	18870
Lazoulé - Hijab Segi Empat Paris Jadul Varisha | Paris Jadul Azara	47658293044	Dark maroon	282509275325	500	18870
Lazoulé - Hijab Segi Empat Paris Jadul Varisha | Paris Jadul Azara	47658293044	Bw	282509275296	500	18870
Lazoulé - Hijab Segi Empat Paris Jadul Varisha | Paris Jadul Azara	47658293044	Soft Blue	282509275328	500	18870
Lazoulé - Hijab Segi Empat Paris Jadul Varisha | Paris Jadul Azara	47658293044	Sage green	282509275311	500	18870
Lazoulé - Hijab Segi Empat Paris Jadul Varisha | Paris Jadul Azara	47658293044	Denim	282509275341	500	18870
Lazoulé - Hijab Segi Empat Paris Jadul Varisha | Paris Jadul Azara	47658293044	Dusty Purple	277509275384	500	18870
Lazoulé - Hijab Segi Empat Paris Jadul Varisha | Paris Jadul Azara	47658293044	Orchid	282509275318	500	18870
Lazoulé - Hijab Segi Empat Paris Jadul Varisha | Paris Jadul Azara	47658293044	Rose berry	282509275319	500	18870
Lazoulé - Hijab Segi Empat Paris Jadul Varisha | Paris Jadul Azara	47658293044	Silver	282509275332	500	18870
Lazoulé - Hijab Segi Empat Paris Jadul Varisha | Paris Jadul Azara	47658293044	Stone grey	282509275335	500	18870
Lazoulé - Hijab Segi Empat Paris Jadul Varisha | Paris Jadul Azara	47658293044	Soft mint	277509275421	500	18870
Lazoulé - Hijab Segi Empat Paris Jadul Varisha | Paris Jadul Azara	47658293044	Taro	277509275411	500	18870
Lazoulé - Hijab Segi Empat Paris Jadul Varisha | Paris Jadul Azara	47658293044	Oat	277509275400	500	18870
Lazoulé - Hijab Segi Empat Paris Jadul Varisha | Paris Jadul Azara	47658293044	Sakura	277509275422	500	18870
Lazoulé - Hijab Segi Empat Paris Jadul Varisha | Paris Jadul Azara	47658293044	Dusty pink	282509275333	500	18870
Lazoulé - Hijab Segi Empat Paris Jadul Varisha | Paris Jadul Azara	47658293044	Birel	277509275385	500	18870
Lazoulé - Hijab Segi Empat Paris Jadul Varisha | Paris Jadul Azara	47658293044	Terakota	277509275412	500	18870
Lazoulé - Hijab Segi Empat Paris Jadul Varisha | Paris Jadul Azara	47658293044	Mustard	282509275326	500	18870
Lazoulé - Hijab Segi Empat Paris Jadul Varisha | Paris Jadul Azara	47658293044	Lilac	277509275413	500	18870
Lazoulé - Hijab Segi Empat Paris Jadul Varisha | Paris Jadul Azara	47658293044	Zaitun	277509275401	500	18870
Lazoulé - Hijab Segi Empat Paris Jadul Varisha | Paris Jadul Azara	47658293044	Salem	282509275312	500	18870
Lazoulé - Hijab Segi Empat Paris Jadul Varisha | Paris Jadul Azara	47658293044	Dark grey	282509275320	500	18870
Lazoulé - Hijab Segi Empat Paris Jadul Varisha | Paris Jadul Azara	47658293044	Binacota	282509275336	500	18870
Lazoulé - Hijab Segi Empat Paris Jadul Varisha | Paris Jadul Azara	47658293044	Coklat pramuka	277509275395	499	18870
Lazoulé - Hijab Segi Empat Paris Jadul Varisha | Paris Jadul Azara	47658293044	Beige	282509275291	500	18870
Lazoulé - Hijab Segi Empat Paris Jadul Varisha | Paris Jadul Azara	47658293044	Bata	277509275407	500	18870
Lazoulé - Hijab Segi Empat Paris Jadul Varisha | Paris Jadul Azara	47658293044	Stone	282509275313	500	18870
Lazoulé - Hijab Segi Empat Paris Jadul Varisha | Paris Jadul Azara	47658293044	Peony	282509275305	500	18870
Lazoulé - Hijab Segi Empat Paris Jadul Varisha | Paris Jadul Azara	47658293044	Dessert sage	282509275297	500	18870
Lazoulé - Hijab Segi Empat Paris Jadul Varisha | Paris Jadul Azara	47658293044	Soft lilac	277509275397	500	18870
Lazoulé - Hijab Segi Empat Paris Jadul Varisha | Paris Jadul Azara	47658293044	Brunet	282509275306	500	18870
Lazoulé - Hijab Segi Empat Paris Jadul Varisha | Paris Jadul Azara	47658293044	Butter	282509275292	500	18870
Lazoulé - Hijab Segi Empat Paris Jadul Varisha | Paris Jadul Azara	47658293044	Coffe	277509275390	500	18870
Lazoulé - Hijab Segi Empat Paris Jadul Varisha | Paris Jadul Azara	47658293044	Olive	282509275293	500	18870
Lazoulé - Hijab Segi Empat Paris Jadul Varisha | Paris Jadul Azara	47658293044	Emerald green	282509275321	500	18870
Lazoulé - Hijab Segi Empat Paris Jadul Varisha | Paris Jadul Azara	47658293044	Wine	282509275302	500	18870
Lazoulé - Hijab Segi Empat Paris Jadul Varisha | Paris Jadul Azara	47658293044	Vanilla cream	277509275424	500	18870
Lazoulé - Hijab Segi Empat Paris Jadul Varisha | Paris Jadul Azara	47658293044	Smoky	277509275391	500	18870
Lazoulé - Hijab Segi Empat Paris Jadul Varisha | Paris Jadul Azara	47658293044	Cheesnut	277509275408	500	18870
Lazoulé - Hijab Segi Empat Paris Jadul Varisha | Paris Jadul Azara	47658293044	Choco malt	282509275329	500	18870
Lazoulé - Hijab Segi Empat Paris Jadul Varisha | Paris Jadul Azara	47658293044	Medium oak	277509275423	500	18870
Lazoulé - Hijab Segi Empat Paris Jadul Varisha | Paris Jadul Azara	47658293044	Frapucino	282509275307	500	18870
Lazoulé - Hijab Segi Empat Paris Jadul Varisha | Paris Jadul Azara	47658293044	Natural	277509275418	500	18870
Lazoulé - Hijab Segi Empat Paris Jadul Varisha | Paris Jadul Azara	47658293044	Clay	282509275314	500	18870
Lazoulé - Hijab Segi Empat Paris Jadul Varisha | Paris Jadul Azara	47658293044	Rosewood	282509275308	500	18870
Lazoulé - Hijab Segi Empat Paris Jadul Varisha | Paris Jadul Azara	47658293044	Cookies	282509275334	500	18870
Lazoulé - Hijab Segi Empat Paris Jadul Varisha | Paris Jadul Azara	47658293044	Nude	282509275303	499	18870
Lazoulé - Hijab Segi Empat Paris Jadul Varisha | Paris Jadul Azara	47658293044	Baby pink	277509275398	499	18870
Lazoulé - Hijab Segi Empat Paris Jadul Varisha | Paris Jadul Azara	47658293044	Emerald Blue	277509275425	500	18870
Lazoulé - Hijab Segi Empat Paris Jadul Varisha | Paris Jadul Azara	47658293044	Misty Grey	277509275399	500	18870
Lazoulé - Hijab Segi Empat Paris Jadul Varisha | Paris Jadul Azara	47658293044	Mauve	277509275409	500	18870
Lazoulé - Hijab Segi Empat Paris Jadul Varisha | Paris Jadul Azara	47658293044	Blue grey	282509275315	500	18870
Lazoulé - Hijab Segi Empat Paris Jadul Varisha | Paris Jadul Azara	47658293044	Bricket	282509275304	500	18870
Lazoulé - Hijab Segi Empat Paris Jadul Varisha | Paris Jadul Azara	47658293044	Lime	277509275417	500	18870
Lazoulé - Hijab Segi Empat Paris Jadul Varisha | Paris Jadul Azara	47658293044	Burgundy	277509275402	500	18870
Lazoulé - Hijab Segi Empat Paris Jadul Varisha | Paris Jadul Azara	47658293044	Pastel Pink	282509275337	499	18870
Lazoulé - Hijab Segi Empat Paris Jadul Varisha | Paris Jadul Azara	47658293044	Dusty Rose	282509275322	500	18870
Lazoulé - Hijab Segi Empat Paris Jadul Varisha | Paris Jadul Azara	47658293044	Coklat mahogany	282509275330	500	18870
Lazoulé - Hijab Segi Empat Paris Jadul Varisha | Paris Jadul Azara	47658293044	Hijau botol	277509275426	500	18870
Lazoulé - Hijab Segi Empat Paris Jadul Varisha | Paris Jadul Azara	47658293044	Nude pink	277509275419	500	18870
Lazoulé - Inner Basic Turkey | Ciput Tali Kaos Rayon Premium	44129795351	Hitam	395735213918	499	14500
Lazoulé - Inner Basic Turkey | Ciput Tali Kaos Rayon Premium	44129795351	Pink	395735213921	500	14500
Lazoulé - Inner Basic Turkey | Ciput Tali Kaos Rayon Premium	44129795351	Gray	395735213913	500	14500
Lazoulé - Inner Basic Turkey | Ciput Tali Kaos Rayon Premium	44129795351	Oat	395735213909	500	14500
Lazoulé - Inner Basic Turkey | Ciput Tali Kaos Rayon Premium	44129795351	Latte	395735213914	500	14500
Lazoulé - Inner Basic Turkey | Ciput Tali Kaos Rayon Premium	44129795351	Nude	395735213915	500	14500
Lazoulé - Inner Basic Turkey | Ciput Tali Kaos Rayon Premium	44129795351	Milo	395735213916	500	14500
Lazoulé - Inner Basic Turkey | Ciput Tali Kaos Rayon Premium	44129795351	Khaki	395735213917	500	14500
Lazoulé - Inner Basic Turkey | Ciput Tali Kaos Rayon Premium	44129795351	Wood	395735213922	499	14500
Lazoulé - Inner Basic Turkey | Ciput Tali Kaos Rayon Premium	44129795351	Espresso	395735213910	499	14500
Lazoulé - Inner Basic Turkey | Ciput Tali Kaos Rayon Premium	44129795351	Choco	395735213919	500	14500
Lazoulé - Inner Basic Turkey | Ciput Tali Kaos Rayon Premium	44129795351	Bronze	395735213911	500	14500
Lazoulé - Inner Basic Turkey | Ciput Tali Kaos Rayon Premium	44129795351	Navy	395735213920	500	14500
Lazoulé - Inner Basic Turkey | Ciput Tali Kaos Rayon Premium	44129795351	Putih	395735213912	500	14500
Lazoulé - Paris Square | Hijab Segi Empat Paris Premium	28944521101	Blue electric	430735233219	500	25662
Lazoulé - Paris Square | Hijab Segi Empat Paris Premium	28944521101	Turkish	430735233192	500	25662
Lazoulé - Paris Square | Hijab Segi Empat Paris Premium	28944521101	ocean	430735233211	0	25662
Lazoulé - Paris Square | Hijab Segi Empat Paris Premium	28944521101	skyblue	430735233199	500	25662
Lazoulé - Paris Square | Hijab Segi Empat Paris Premium	28944521101	Mustard	430735233204	500	25662
Lazoulé - Paris Square | Hijab Segi Empat Paris Premium	28944521101	Biscuit	430735233220	500	25662
Lazoulé - Paris Square | Hijab Segi Empat Paris Premium	28944521101	Magenta	430735233183	500	25662
Lazoulé - Paris Square | Hijab Segi Empat Paris Premium	28944521101	Dark Purple	430735233200	500	25662
Lazoulé - Paris Square | Hijab Segi Empat Paris Premium	28944521101	soft lilac	430735233205	500	25662
Lazoulé - Paris Square | Hijab Segi Empat Paris Premium	28944521101	misty	430735233221	0	25662
Lazoulé - Paris Square | Hijab Segi Empat Paris Premium	28944521101	wardah	430735233201	0	25662
Lazoulé - Paris Square | Hijab Segi Empat Paris Premium	28944521101	Mint	430735233212	500	25662
Lazoulé - Paris Square | Hijab Segi Empat Paris Premium	28944521101	avocado	430735233184	500	25662
Lazoulé - Paris Square | Hijab Segi Empat Paris Premium	28944521101	denim	430735233222	500	25662
Lazoulé - Paris Square | Hijab Segi Empat Paris Premium	28944521101	Sage	430735233223	500	25662
Lazoulé - Paris Square | Hijab Segi Empat Paris Premium	28944521101	Ivory	430735233185	500	25662
Lazoulé - Paris Square | Hijab Segi Empat Paris Premium	28944521101	cloud	430735233193	500	25662
Lazoulé - Paris Square | Hijab Segi Empat Paris Premium	28944521101	clay	430735233213	500	25662
Lazoulé - Paris Square | Hijab Segi Empat Paris Premium	28944521101	hazel	430735233194	500	25662
Lazoulé - Paris Square | Hijab Segi Empat Paris Premium	28944521101	taupe	430735233195	500	25662
Lazoulé - Paris Square | Hijab Segi Empat Paris Premium	28944521101	smoke	430735233197	500	25662
Lazoulé - Paris Square | Hijab Segi Empat Paris Premium	28944521101	brownie	430735233216	499	25662
Lazoulé - Paris Square | Hijab Segi Empat Paris Premium	28944521101	cedar	430735233214	500	25662
Lazoulé - Paris Square | Hijab Segi Empat Paris Premium	28944521101	walnut	430735233206	500	25662
Lazoulé - Paris Square | Hijab Segi Empat Paris Premium	28944521101	mocca	430735233188	500	25662
Lazoulé - Paris Square | Hijab Segi Empat Paris Premium	28944521101	tortilla	430735233215	500	25662
Lazoulé - Paris Square | Hijab Segi Empat Paris Premium	28944521101	frappucino	430735233217	500	25662
Lazoulé - Paris Square | Hijab Segi Empat Paris Premium	28944521101	rose wood	430735233189	499	25662
Lazoulé - Paris Square | Hijab Segi Empat Paris Premium	28944521101	blush	430735233186	500	25662
Lazoulé - Paris Square | Hijab Segi Empat Paris Premium	28944521101	broken white	430735233202	500	25662
Lazoulé - Paris Square | Hijab Segi Empat Paris Premium	28944521101	white	430735233218	500	25662
Lazoulé - Paris Square | Hijab Segi Empat Paris Premium	28944521101	Lilac	430735233224	500	25662
Lazoulé - Paris Square | Hijab Segi Empat Paris Premium	28944521101	Hijau Tua	430735233196	500	25662
Lazoulé - Paris Square | Hijab Segi Empat Paris Premium	28944521101	basil	430735233225	0	25662
Lazoulé - Paris Square | Hijab Segi Empat Paris Premium	28944521101	grey	430735233226	500	25662
Lazoulé - Paris Square | Hijab Segi Empat Paris Premium	28944521101	silver	430735233207	500	25662
Lazoulé - Paris Square | Hijab Segi Empat Paris Premium	28944521101	iris	430735233190	500	25662
Lazoulé - Paris Square | Hijab Segi Empat Paris Premium	28944521101	wood	430735233187	500	25662
Lazoulé - Paris Square | Hijab Segi Empat Paris Premium	28944521101	pickle	430735233198	0	25662
Lazoulé - Paris Square | Hijab Segi Empat Paris Premium	28944521101	choco nude	430735233227	500	25662
Lazoulé - Paris Square | Hijab Segi Empat Paris Premium	28944521101	latte	430735233208	500	25662
Lazoulé - Paris Square | Hijab Segi Empat Paris Premium	28944521101	coconut	430735233191	500	25662
Lazoulé - Paris Square | Hijab Segi Empat Paris Premium	28944521101	black	430735233209	500	25662
Lazoulé - Paris Square | Hijab Segi Empat Paris Premium	28944521101	navy	430735233210	500	25662
Lazoulé - Paris Square | Hijab Segi Empat Paris Premium	28944521101	maroon	430735233203	500	25662
Lazoulé - Plain Polycotton Square Hijab | Hijab Segiempat Polycotton no	52908272964	Black	395735243275	500	25550
Lazoulé - Plain Polycotton Square Hijab | Hijab Segiempat Polycotton no	52908272964	BW	395735243281	499	25550
Lazoulé - Plain Polycotton Square Hijab | Hijab Segiempat Polycotton no	52908272964	Ivory	395735243276	500	25550
Lazoulé - Plain Polycotton Square Hijab | Hijab Segiempat Polycotton no	52908272964	Latte	395735243287	0	25550
Lazoulé - Plain Polycotton Square Hijab | Hijab Segiempat Polycotton no	52908272964	Grey	395735243277	500	25550
Lazoulé - Plain Polycotton Square Hijab | Hijab Segiempat Polycotton no	52908272964	Dark Grey	395735243278	500	25550
Lazoulé - Plain Polycotton Square Hijab | Hijab Segiempat Polycotton no	52908272964	Beige	395735243285	500	25550
Lazoulé - Plain Polycotton Square Hijab | Hijab Segiempat Polycotton no	52908272964	Lavender	395735243286	500	25550
Lazoulé - Plain Polycotton Square Hijab | Hijab Segiempat Polycotton no	52908272964	Navy	395735243282	500	25550
Lazoulé - Plain Polycotton Square Hijab | Hijab Segiempat Polycotton no	52908272964	Matcha	395735243288	499	25550
Lazoulé - Plain Polycotton Square Hijab | Hijab Segiempat Polycotton no	52908272964	Baby Pink	395735243279	0	25550
Lazoulé - Plain Polycotton Square Hijab | Hijab Segiempat Polycotton no	52908272964	Biscuit	395735243283	0	25550
Lazoulé - Plain Polycotton Square Hijab | Hijab Segiempat Polycotton no	52908272964	Burgundy	395735243284	500	25550
Lazoulé - Plain Polycotton Square Hijab | Hijab Segiempat Polycotton no	52908272964	Brown	395735243280	500	25550
Lazoulé - Plain Polycotton Square Hijab | Hijab Segiempat Polycotton no	52908272964	Denim	395735243289	500	25550
Lazoulé - Plain Polycotton Square Hijab | Hijab Segiempat Polycotton no	52908272964	Milo	395735243290	500	25550
Lazoulé - Plain Polycotton Square Hijab | Hijab Segiempat Polycotton no	52908272964	Creamy	395735243291	500	25550`;

const lines = rawData.trim().split('\n').slice(1);

const categoriesMap = new Map();

for (const line of lines) {
  const parts = line.split('\t');
  if (parts.length < 6) continue;
  
  const productName = parts[0].trim();
  const itemId = parts[1].trim();
  const variantName = parts[2].trim();
  const variantId = parts[3].trim();
  const stock = parseInt(parts[4].trim(), 10) || 0;
  
  if (!categoriesMap.has(itemId)) {
    categoriesMap.set(itemId, {
      id: itemId,
      name: productName,
      variants: []
    });
  }
  
  const category = categoriesMap.get(itemId);
  category.variants.push({
    id: variantId,
    name: variantName,
    stock: stock,
    isOut: stock === 0
  });
}

const result = Array.from(categoriesMap.values());

const tsCode = `import { Category } from '../types';\n\nexport const INITIAL_DATA: Category[] = ${JSON.stringify(result, null, 2)};\n`;

fs.writeFileSync('e:/project/lzist/apps/src/data/restockInitialData.ts', tsCode);
console.log('Successfully generated e:/project/lzist/apps/src/data/restockInitialData.ts');
