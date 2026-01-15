#!/bin/bash
echo "=== MongoDB Content Inspection ==="

docker exec sendroli-mongodb mongosh admin -u admin -p nhPUGO8s0YIhqJPIyGhbklApO --eval '
  print("Connected! Listing Databases:");
  db.adminCommand("listDatabases").databases.forEach(d => {
    print("\n--------------------------------");
    print("📂 DB: " + d.name + " (" + d.sizeOnDisk/1024 + " KB)");
    if(d.sizeOnDisk > 0) {
       var targetDb = db.getSiblingDB(d.name);
       targetDb.getCollectionNames().forEach(c => {
         var count = targetDb.getCollection(c).countDocuments();
         print("   - " + c + ": " + count + " docs");
       });
    }
  });
'
