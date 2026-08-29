# Portrait database

`portraits.json` is the canonical portrait manifest. Every unique scholar in `tree.txt` has an entry with:

- `file`: a local, optimized portrait file, or `null` when no safe match is available;
- `source`: the academic or institutional page used to establish identity;
- `imageSource`: the original public image URL;
- `status`: `verified` or `needs-verification`.

GitHub account avatars are not used. Each included portrait was checked visually against an academic, institutional, professional-society, or scholar-owned page. The interface falls back to the scholar's initials rather than displaying an uncertain or incorrect person.

Martin D. F. Wong's portrait source is the [2021 CUHK Conference on Financial Technology](https://conference2021.cefar.cuhk.edu.hk/guests-of-honour/).
