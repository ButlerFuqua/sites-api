
const sites = [
    { _id: 1, title: "Sally's blog", name: "Sally Seashore", about: "I am Sally. I like seeling seashells.", phoneNumber: "8083674199" }
]

export = {
    find(criteria) {
        if (!criteria)
            return sites
        else {
            return sites.filter(site => matchCriteria(site, criteria))[0]
        }
    },
    create(data) {
        const newSite = { ...data, _id: sites.length + 1 }
        sites.push(newSite)
        return newSite
    },
    updateById(id, data) {
        if (!id) throw new Error(`Missing ID`)
        return data
    },
    findByIdAndDelete() {
        return true;
    },

}

function matchCriteria(site, criteria) {
    let match = false
    for (let prop in site)
        if (site[prop] == criteria[prop])
            match = true
    return match
}