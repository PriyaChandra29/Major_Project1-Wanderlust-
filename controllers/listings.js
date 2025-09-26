const Listing = require("../models/listing");


module.exports.index = async (req,res) =>{
    const allListings = await Listing.find({});
    res.render("listings/index.ejs",{allListings});
};

module.exports.renderNewForm = (req,res) =>{
    res.render("listings/new.ejs");
};

module.exports.showListing = async (req,res) =>{
    let{id}=req.params;
    const listing = await Listing.findById(id).populate({path:"reviews", populate: {path :"author"},}).populate("owner");
    if( ! listing ){
        req.flash("error","Listing for which you requested doesn't exist!");
         return res.redirect("/listings");
    }

    // Fix missing coordinates
    if (!listing.geometry.coordinates.length) {
        const placeName = `${listing.location}, ${listing.country}`;
        const geo = await geocode(placeName);
        if (geo) {
            listing.geometry = {
                type: "Point",
                coordinates: [geo.lon, geo.lat],
            };
            await listing.save();
        }
    }


    console.log(listing);
    res.render("listings/show.ejs",{listing});
};

// Simple geocoding helper (Nominatim OSM)
async function geocode(query) {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;
    const res = await fetch(url, {
        headers: { "User-Agent": "wanderlust-app/1.0 (your-email@example.com)" }
    });
    const data = await res.json();
    if (!data.length) return null;
    return {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon),
        name: data[0].display_name,
    };
}

module.exports.createListing = async (req,res,next) =>{
    let url = req.file.path;
    let filename = req.file.filename;
    const newListing = new Listing(req.body.listing);
    // console.log(req.user);
    newListing.owner= req.user._id;
    newListing.image = {url, filename};

    // adding geocoding
    const placeName = `${newListing.location}, ${newListing.country}`;
    const geo = await geocode(placeName);

    console.log(" Geocode input:", placeName);
    console.log(" Geocode result:", geo); 

    if (geo) {
        newListing.geometry = {
            type: "Point",
            coordinates: [geo.lon, geo.lat] // GeoJSON requires [lng, lat]
        };
    }

    await newListing.save();
    req.flash("success","New Listing Created!");
    res.redirect("/listings");
        
};

module.exports.renderEditForm = async (req,res) =>{
    let{id}=req.params;
    const listing = await Listing.findById(id);
    if( ! listing ){
        req.flash("error","Listing for which you requested doesn't exist!");
        return res.redirect("/listings");
    }

   let imageUrl = listing.image.url;

    // Remove any existing width/height params (w=..., h=...)
    imageUrl = imageUrl.replace(/([&?])(w|h)=\d+/g, "");

    // Also clean up double && or ?& that might appear
    imageUrl = imageUrl.replace("&&", "&").replace("?&", "?");

    // Now add consistent resizing
    if (imageUrl.includes("/upload/")) {
        // Cloudinary
        imageUrl = imageUrl.replace(
        "/upload/",
        "/upload/w_300,h_250,c_fill/"
    );
    } else {
        // Unsplash or plain .jpg
        if (imageUrl.includes("?")) {
            imageUrl = imageUrl + "&w=300&h=250&fit=crop&crop=faces,center";
        } else {
            imageUrl = imageUrl + "?w=300&h=250&fit=crop&crop=faces,center";
        }
    }


    res.render("listings/edit.ejs",{ listing , imageUrl});
};

module.exports.updateListing = async(req,res) =>{
    let {id}=req.params;
    let listing = await Listing.findByIdAndUpdate(id, {...req.body.listing}, { new: true });

    if(typeof req.file !== "undefined"){
        let url = req.file.path;
        let filename = req.file.filename;
        listing.image = {url, filename};
        await listing.save();
    }

    //  If location or country changed, re-geocode
    if (req.body.listing.location || req.body.listing.country) {
        const placeName = `${listing.location}, ${listing.country}`;
        const geo = await geocode(placeName);
        if (geo) {
            listing.geometry = {
                type: "Point",
                coordinates: [geo.lon, geo.lat]
            };
            await listing.save();
        }
    }

    req.flash("success","Listing Updated!");
    res.redirect(`/listings/${id}`);
};

module.exports.destroyListing = async(req,res)=>{
    let{id}=req.params;
    let deletedListing =await Listing.findByIdAndDelete(id);
    console.log(deletedListing);
    req.flash("success","Listing Deleted!");
    res.redirect("/listings");
};
