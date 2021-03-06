<?php
/**
 * Pimcore
 *
 * This source file is subject to the GNU General Public License version 3 (GPLv3)
 * For the full copyright and license information, please view the LICENSE.md and gpl-3.0.txt
 * files that are distributed with this source code.
 *
 * @category   Pimcore
 * @package    Object
 * @copyright  Copyright (c) 2009-2015 pimcore GmbH (http://www.pimcore.org)
 * @license    http://www.pimcore.org/license     GNU General Public License version 3 (GPLv3)
 */

namespace Pimcore\Model\Object\Classificationstore\CollectionGroupRelation\Listing;

use Pimcore\Model;
use Pimcore\Model\Object;

class Resource extends Model\Listing\Resource\AbstractResource {

    /**
     * Loads a list of Classificationstore group configs for the specifies parameters, returns an array of config elements
     *
     * @return array
     */
    public function load()
    {
        $condition = $this->getCondition();
        if ($condition) {
            $condition = $condition . " AND ";
        } else {
            $condition = " where ";
        }
        $condition .= Object\Classificationstore\CollectionGroupRelation\Resource::TABLE_NAME_RELATIONS
            . ".groupId = " . Object\Classificationstore\GroupConfig\Resource::TABLE_NAME_GROUPS . ".id";

        $sql = "SELECT * FROM " . Object\Classificationstore\CollectionGroupRelation\Resource::TABLE_NAME_RELATIONS
            . "," . Object\Classificationstore\GroupConfig\Resource::TABLE_NAME_GROUPS
            . $condition . $this->getOrder() . $this->getOffsetLimit();

        $data = $this->db->fetchAll($sql, $this->model->getConditionVariables());

        $configData = array();
        foreach ($data as $dataItem) {
            $entry = new Object\Classificationstore\CollectionGroupRelation();
            $resource = $entry->getResource();
            $resource->assignVariablesToModel($dataItem);

            $configData[] = $entry;
        }

        $this->model->setList($configData);
        return $configData;
    }

    /**
     * @return array
     */
    public function getDataArray() {
        $configsData = $this->db->fetchAll("SELECT * FROM " . Object\Classificationstore\CollectionGroupRelation\Resource::TABLE_NAME_RELATIONS . $this->getCondition() . $this->getOrder() . $this->getOffsetLimit(), $this->model->getConditionVariables());
        return $configsData;
    }

    /**
     * @return int
     */
    public function getTotalCount() {

        try {
            $amount = (int) $this->db->fetchOne("SELECT COUNT(*) as amount FROM " . Object\Classificationstore\CollectionGroupRelation\Resource::TABLE_NAME_RELATIONS . " ". $this->getCondition(), $this->model->getConditionVariables());
        } catch (\Exception $e) {

        }

        return $amount;
    }
}
