package com.fieldforce.model;

public interface RegionBound {
    /**
     * Returns the region/zone identifier associated with the entity.
     * For devices this is the site, for teams this is the zone, and for tickets the site.
     */
    String getZone();
}
