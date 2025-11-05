const Party = require("../../models/store/party.model");
const { sendResponse } = require("../../helper/response");
const { Types: { ObjectId }, } = require("mongoose");
const PartyGroup = require('../../models/store/party_group.model');
const PartyTag = require('../../models/store/party_tag.model');
const Firm = require('../../models/firm.model');

exports.getParty = async (req, res) => {
  const { store_type, is_admin, project } = req.body;
  if (req.user && !req.error) {
    try {
      const query = { deleted: false };
      if (store_type && is_admin) {
        query.store_type = store_type;
        query.is_admin = is_admin;
      }

      if (store_type) {
        query.store_type = store_type;
      }
      if (is_admin) {
        query.is_admin = is_admin;
      }
      if (project) {
        query.project = project;
      }
      await Party.find(query, { deleted: 0 })
        .sort({ name: 1 })
        .populate("firm_id", "name")
        .populate("year_id", "start_year end_year")
        .populate("partyGroup", "name")
        .populate("party_tag_id", "name")
        .populate("auth_person_id", "name")
        .then((data) => {
          if (data) {
            sendResponse(res, 200, true, data, "Party list");
          } else {
            sendResponse(res, 400, false, {}, "Party not found");
          }
        });
    } catch (error) {
      console.log(error);
      sendResponse(res, 500, false, {}, "Something went wrong");
    }
  } else {
    sendResponse(res, 401, false, {}, "Unauthorized");
  }
};

// exports.getAdminParty = async (req, res) => {
//   const { store_type, is_admin, project } = req.body;
//   if (req.user && !req.error) {
//     try {
//       const query = { deleted: false };
//       if (store_type && is_admin) {
//         query.store_type = store_type;
//         query.is_admin = is_admin;
//       }

//       if (store_type) {
//         query.store_type = store_type;
//       }
//       if (is_admin) {
//         query.is_admin = is_admin;
//       }
//       if (project) {
//         query.project = project;
//       }
//       await Party.find(query, { deleted: 0 })
//         .sort({ createdAt: -1 })
//         .populate("firm_id", "name")
//         .populate("year_id", "start_year end_year")
//         .populate("partyGroup", "name")
//         .populate("party_tag_id", "name")
//         .populate("auth_person_id", "name")
//         .then((data) => {
//           if (data) {
//             sendResponse(res, 200, true, data, "Party list");
//           } else {
//             sendResponse(res, 400, false, [], "Party not found");
//           }
//         });
//     } catch (error) {
//       sendResponse(res, 500, false, {}, "Something went wrong");
//     }
//   } else {
//     sendResponse(res, 401, false, {}, "Unauthorized");
//   }
// };

exports.getAdminParty = async (req, res) => {
  const { store_type, is_admin, project, search, currentPage, limit } = req.body;
  console.log("req.body", req.body);

  if (req.user && !req.error) {
    try {
      const query = { deleted: false };

      if (store_type) query.store_type = store_type;
      if (is_admin !== undefined) query.is_admin = is_admin;
      if (project) query.project = project;

     function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

const searchRegex = search ? new RegExp(escapeRegex(search), "i") : null;

if (searchRegex) {
  const matchedGroupIds = await PartyGroup.find({ name: searchRegex }, { _id: 1 }).lean();
  const matchedTagIds = await PartyTag.find({ name: searchRegex }, { _id: 1 }).lean();

  query.$or = [
    { name: searchRegex },
    { partyGroup: { $in: matchedGroupIds.map(g => g._id) } },
    { party_tag_id: { $in: matchedTagIds.map(t => t._id) } },
  ];
}

      // Check if limit is null, zero, or not a positive number
      const limitNum = parseInt(limit);
      const pageNum = parseInt(currentPage) || 1;
      let data;
      let total;

      if (!limitNum || limitNum <= 0) {
        // No pagination - return all matching data
        total = await Party.countDocuments(query);
        data = await Party.find(query, { deleted: 0 })
          .sort({ createdAt: -1 })
          .populate("firm_id", "name")
          .populate("year_id", "start_year end_year")
          .populate("partyGroup", "name")
          .populate("party_tag_id", "name")
          .populate("auth_person_id", "name")
          .lean();
      } else {
        // Apply pagination
        const skip = (pageNum - 1) * limitNum;
        total = await Party.countDocuments(query);
        data = await Party.find(query, { deleted: 0 })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNum)
          .populate("firm_id", "name")
          .populate("year_id", "start_year end_year")
          .populate("partyGroup", "name")
          .populate("party_tag_id", "name")
          .populate("auth_person_id", "name")
          .lean();
      }

      const response = {
        data,
        pagination: {
          currentPage: limitNum && limitNum > 0 ? pageNum : 1,
          limit: limitNum && limitNum > 0 ? limitNum : total,
          total,
          totalPages: limitNum && limitNum > 0 ? Math.ceil(total / limitNum) : 1,
          search,
        },
      };

      sendResponse(res, 200, true, response, "Party list");
    } catch (error) {
      console.error("Error fetching admin party:", error);
      sendResponse(res, 500, false, {}, "Something went wrong");
    }
  } else {
    sendResponse(res, 401, false, {}, "Unauthorized");
  }
};

// exports.getAdminParty = async (req, res) => {
//   const { store_type, is_admin, project, search, currentPage, limit } = req.body;
// console.log("req.body", req.body);
//   if (req.user && !req.error) {
//     try {
//       const query = { deleted: false };

//       if (store_type) query.store_type = store_type;
//       if (is_admin !== undefined) query.is_admin = is_admin;
//       if (project) query.project = project;

//       const searchRegex = search ? new RegExp(search, "i") : null;

//       // if (searchRegex) {
//       //   query.$or = [
//       //     { name: searchRegex }, // Party name
//       //     // { group: searchRegex }, // Assuming group is a direct field
//       //     // { tag: searchRegex },   // Assuming tag is a direct field
//       //     { group_name: searchRegex },
//       //     { tag_name: searchRegex },

//       //   ];
//       // }

//           if (searchRegex) {
//       // Assuming you have Mongoose models for PartyGroup and PartyTag
     

//       // Find groups and tags whose name matches search
//       // matchedFirmIds = await Party.find({ name: searchRegex }, { _id: 1 }).lean();
//       // matchedFirmIds = matchedFirmIds.map(t => t._id);

//       matchedGroupIds = await PartyGroup.find({ name: searchRegex }, { _id: 1 }).lean();
//       matchedGroupIds = matchedGroupIds.map(g => g._id);

//       matchedTagIds = await PartyTag.find({ name: searchRegex }, { _id: 1 }).lean();
//       matchedTagIds = matchedTagIds.map(t => t._id);

//       // Extend query with $or for party name or matching group/tag IDs
//       query.$or = [
//         { name: searchRegex },
//         { partyGroup: { $in: matchedGroupIds } },
//         { party_tag_id: { $in: matchedTagIds } },
//         // { firm_id: { $in: matchedFirmIds } },
//       ];
//     }

//       const pageNum = parseInt(currentPage) || 1;
//       const limitNum = parseInt(limit) || 10;
//       const skip = (pageNum - 1) * limitNum;

//       // Count total documents for pagination
//       const total = await Party.countDocuments(query);

//       // Fetch paginated data
//       const data = await Party.find(query, { deleted: 0 })
//         .sort({ createdAt: -1 })
//         .skip(skip)
//         .limit(limitNum)
//         .populate("firm_id", "name")
//         .populate("year_id", "start_year end_year")
//         .populate("partyGroup", "name")
//         .populate("party_tag_id", "name")
//         .populate("auth_person_id", "name")
//         .lean();

//       const response = {
//         data,
//         pagination:{
//         currentPage: pageNum,
//         limit: limitNum,
//         total,
//         totalPages: Math.ceil(total / limitNum),
//         search
//         }
       
//       };

//       sendResponse(res, 200, true, response, "Party list");
//     } catch (error) {
//       console.error("Error fetching admin party:", error);
//       sendResponse(res, 500, false, {}, "Something went wrong");
//     }
//   } else {
//     sendResponse(res, 401, false, {}, "Unauthorized");
//   }
// };

exports.manageParty = async (req, res) => {
  const {
    // firm_id,
    year_id,
    name,
    address,
    address_two,
    address_three,
    city,
    state,
    pincode,
    pancard_no,
    party_tag_id,
    auth_person_id,
    req_no,
    phone,
    email,
    gstNumber,
    partyGroup,
    store_type,
    is_admin,
    ifsc_code,
    bank_name,
    bank_acc_no,
    udyam_no,
    logo,
    status,
    project,
    id,
  } = req.body;
  if (req.user) {
    if (
      name &&
      // address &&
      // phone &&
      partyGroup &&
      // city &&
      // state &&
      // pincode &&
      party_tag_id
    ) {
      const authPerson =
        auth_person_id === "" || auth_person_id === "undefined"
          ? null
          : auth_person_id;

      const storeType = store_type === "" || store_type === "undefined" ? 0 : store_type;


      const PartyObject = new Party({
        // firm_id: firm_id,
        year_id: year_id,
        name: name,
        phone: phone === 'null' ? null : phone,
        email: email,
        gstNumber: gstNumber,
        partyGroup: partyGroup,
        address: address,
        address_two: address_two,
        address_three: address_three,
        city: city,
        state: state,
        pincode: pincode === 'null' ? null : pincode,
        pancard_no: pancard_no,
        party_tag_id: party_tag_id,
        auth_person_id: authPerson,
        store_type: storeType,
        req_no: req_no,
        is_admin: is_admin,
        ifsc_code: ifsc_code,
        bank_name: bank_name,
        bank_acc_no: bank_acc_no,
        udyam_no: udyam_no,
        logo: logo,
        project: project,
      });
      const message = is_admin ? 'Client' : 'Party';
      if (!id) {
        try {
          const existingParty = await Party.findOne({ name: name, project: new ObjectId(project) })
          if (existingParty !== null) {
            return sendResponse(res, 200, false, {}, 'Party already exists.');
          } else {
            await PartyObject.save()
              .then((data) => {
                sendResponse(res, 200, true, {}, `${message} added successfully`);
              })
              .catch((error) => {
                sendResponse(res, 500, false, {}, error.message);
              });
          }
        } catch (error) {
          console.log(error, '!!')
          sendResponse(res, 500, false, {}, "Something went wrong");
        }
      } else {
        try {
          const existingParty = await Party.findOne({ name: name, project: new ObjectId(project) });
          if (existingParty) {
            return sendResponse(res, 200, false, {}, 'Party name already exists.');
          } else {
            await Party.findByIdAndUpdate(id, {
              // firm_id: firm_id,
              year_id: year_id,
              name: name,
              address: address,
              phone: phone === 'null' ? null : phone,
              email: email,
              gstNumber: gstNumber,
              partyGroup: partyGroup,
              store_type: storeType,
              address_two: address_two,
              address_three: address_three,
              city: city,
              state: state,
              pincode: pincode,
              pancard_no: pancard_no,
              party_tag_id: party_tag_id,
              auth_person_id: authPerson,
              req_no: req_no,
              status: status,
              is_admin: is_admin,
              ifsc_code: ifsc_code,
              bank_name: bank_name,
              bank_acc_no: bank_acc_no,
              udyam_no: udyam_no,
              logo: logo,
              project: project,
            }).then((data) => {
              if (data) {
                sendResponse(res, 200, true, {}, `${message} updated successfully`);
              } else {
                sendResponse(res, 200, true, {}, `${message} not found`);
              }
            });
          }
        } catch (error) {
          sendResponse(res, 500, false, {}, "Something went wrong");
        }
      }
    } else {
      sendResponse(res, 400, false, {}, "Missing parameters");
    }
  } else {
    sendResponse(res, 401, false, {}, "Unauthorized");
  }
};

exports.deleteParty = async (req, res) => {
  const { id } = req.body;
  if (req.user && !req.error && id) {
    try {
      await Party.findByIdAndUpdate(id, { deleted: true }).then((data) => {
        if (data) {
          const message = data?.is_admin ? 'Client' : 'Party';
          sendResponse(res, 200, true, {}, `${message} deleted successfully`);
        }
      });
    } catch (error) {
      sendResponse(res, 500, false, {}, "Something went wrong");
    }
  } else {
    sendResponse(res, 401, false, {}, "Unauthorized");
  }
};
